import "react-native-url-polyfill/auto";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Dimensions, Image, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";

import { lightColors, darkColors, Palette } from "./src/colors";
import { Choice, GameState, Scenario, Scene } from "./src/types";
import { SCENARIOS, SCENARIO_MAP } from "./src/scenarios";
import { modifierDefs, modifierGroups, applyStartingModifiers, applyPassiveDrains, hasMod, lawTick } from "./src/modifiers";
import { freshState, applyEffects, shufflePickOrder, pickChoice } from "./src/engine";
import { EDUCATION, Lesson } from "./src/education";
import { QuizScores, CampaignScores, loadQuizScores, saveQuizScore, loadCampaignScores, saveCampaignScore, computeCampaignScore, computeOverallPercent } from "./src/progressStore";
import { Budget, BudgetItem, BudgetCategory, loadBudget, saveBudget, newBudgetItemId, BUDGET_STARTER_ITEMS, LEASE_CHECKLIST, TAX_DOCS, TaxDocState, loadTaxDocs, saveTaxDocs, loadChecklist, saveChecklist, exportAllData, importAllData, resetEverything } from "./src/toolsStore";
import { Profile, loadProfile, saveProfile, clearProfile, validateUsername, normalizeUsername, newUserId } from "./src/profileStore";
import { computeTotalPoints, PointsBreakdown } from "./src/leaderboardStore";
import { fetchTopScores, uploadScore, registerUser, updateProfileRow, fetchUserById, fetchUsersByIds, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, LeaderboardRow } from "./src/supabase";
import { SUPABASE_ENABLED } from "./src/config";
import { CustomLevel, loadLevels, upsertLevel, removeLevel, blankLevel, newSceneId, evalRules, interpolate } from "./src/levelStore";
import { SavedCharacter, CHARACTER_PRESETS, loadCharacters, upsertCharacter, removeCharacter, newCharacterId, nextCharacterName } from "./src/characterStore";
import { AVATAR_PRESETS, getPresetSource } from "./src/avatars";

// ============================================================
// THEME
// ============================================================
type ThemeMode = "light" | "dark" | "system";
const THEME_KEY = "nextsteps_theme";

function useAppTheme() {
  const sys = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(v => {
      if (v === "light" || v === "dark" || v === "system") setMode(v);
    });
  }, []);
  const resolved: "light" | "dark" = mode === "system" ? (sys === "dark" ? "dark" : "light") : mode;
  const colors: Palette = resolved === "dark" ? darkColors : lightColors;
  const setThemeMode = async (m: ThemeMode) => { setMode(m); await AsyncStorage.setItem(THEME_KEY, m); };
  return { mode, resolved, colors, setThemeMode };
}

// ============================================================
// ROUTES
// ============================================================
type Route =
  | { name: "splash" }
  | { name: "profile-create" }
  | { name: "leaderboards" }
  | { name: "home" }
  | { name: "learn" }
  | { name: "learn-detail"; scenarioId: string }
  | { name: "quiz"; trackId: string; quizId: string }
  | { name: "play" }
  | { name: "campaign-char-choice"; scenarioId: string }
  | { name: "custom-level-char-choice"; customId: string }
  | { name: "game" }
  | { name: "outcome" }
  | { name: "tools" }
  | { name: "tool-budget" }
  | { name: "tool-lease" }
  | { name: "tool-taxdocs" }
  | { name: "progress" }
  | { name: "settings" }
  | { name: "characters" }
  | { name: "characters-create"; returnTo?: Route }
  | { name: "characters-create-custom"; returnTo?: Route }
  | { name: "friends" }
  | { name: "level-editor-list" }
  | { name: "level-editor"; levelId: string };

// ============================================================
// CUSTOM LEVELS → RUNTIME SCENARIO
// ============================================================
function customLevelToScenario(lvl: CustomLevel): Scenario {
  const sceneMap: Record<string, Scene> = {};
  (lvl.scenes || []).forEach(sc => {
    const scene: Scene = { title: sc.title, text: (s) => interpolate(sc.text || "", s) };
    if (sc.ending) { (scene as any).ending = true; (scene as any).endingKind = sc.endingKind || "mid"; }
    else {
      scene.choices = (sc.choices || []).map(c => ({
        label: c.label, kind: c.kind, feedback: c.feedback,
        effects: (c.effects as any) || {},
        nextId: c.nextId !== undefined ? c.nextId : null,
      }));
    }
    sceneMap[sc.id] = scene;
  });

  // Synthetic finale
  if (lvl.endingRules) {
    sceneMap.finale = {
      title: "Epilogue",
      text: () => "Let's see how it played out.",
      choices: [{
        label: "Continue...", kind: "mid", feedback: "", effects: {},
        next: (st: GameState) => evalRules(st, lvl.endingRules!, "ending_mid"),
      }]
    };
  }

  return {
    id: lvl.id,
    name: lvl.name,
    who: lvl.who,
    desc: lvl.desc,
    estimatedTime: `${(lvl.scenes || []).filter(s => !s.ending).length} scenes`,
    startMoney: lvl.startMoney || 0,
    defaultName: lvl.defaultName || "You",
    accent: "#7C3AED",
    startSceneId: lvl.startSceneId,
    scenes: sceneMap,
  };
}

function customLevelToEducation(lvl: CustomLevel) {
  return {
    lessons: lvl.lessons || [],
    analyze: (s: GameState) => {
      return (lvl.analysisRules || [])
        .filter(r => {
          const c = r.when || {};
          if (c.hasFlag && !s.flags.has(c.hasFlag)) return false;
          if (c.notFlag && s.flags.has(c.notFlag)) return false;
          if (c.lawGte != null && s.law < c.lawGte) return false;
          if (c.wellbeingGte != null && s.wellbeing < c.wellbeingGte) return false;
          return true;
        })
        .map(r => ({ kind: r.kind, text: r.text }));
    }
  };
}

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
  });
  const theme = useAppTheme();
  const [route, setRoute] = useState<Route>({ name: "splash" });
  const [moreOpen, setMoreOpen] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameScenario, setGameScenario] = useState<Scenario | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<any>(null);
  const [levels, setLevels] = useState<CustomLevel[]>([]);
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [quizScores, setQuizScores] = useState<QuizScores>({});
  const [campaignScores, setCampaignScores] = useState<CampaignScores>({});
  const [lastCampaignScore, setLastCampaignScore] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Reload custom levels + characters + progress + profile whenever route changes.
  useEffect(() => {
    loadLevels().then(setLevels);
    loadCharacters().then(setCharacters);
    loadQuizScores().then(setQuizScores);
    loadCampaignScores().then(setCampaignScores);
    loadProfile().then(setProfile);
  }, [route.name]);

  // Totals used by the home-screen hero progress bar. Built-ins only (customs excluded).
  const totalQuizCount = Object.values(EDUCATION).reduce((n, p) => n + p.quizzes.length, 0);
  const builtInIds = SCENARIOS.map(s => s.id);
  const overallPct = computeOverallPercent(quizScores, campaignScores, totalQuizCount, builtInIds);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  const nav = (r: Route) => { setMoreOpen(false); setRoute(r); };

  // ---------- GAME LAUNCHER ----------
  // Unified launcher for both built-in campaigns and custom levels, with
  // optional modifiers from a saved character.
  const launchScenario = (opts: { scenarioId: string; isCustom?: boolean; modifiers?: string[] }) => {
    let sc: Scenario | null;
    if (opts.isCustom) {
      const lvl = levels.find(l => l.id === opts.scenarioId);
      if (!lvl) return;
      sc = customLevelToScenario(lvl);
    } else {
      sc = SCENARIO_MAP[opts.scenarioId] || null;
    }
    if (!sc) return;
    const s = freshState(sc.id, sc.startMoney, sc.defaultName);
    (opts.modifiers || []).forEach(m => s.modifiers.add(m));
    if ((opts.modifiers || []).length > 0) applyStartingModifiers(s);
    s.currentSceneId = sc.startSceneId;
    setGameScenario(sc);
    setGameState(s);
    setPendingFeedback(null);
    setRoute({ name: "game" });
  };

  const onChoicePicked = (choice: Choice) => {
    if (!gameState || !gameScenario) return;
    const result = pickChoice(gameState, choice, gameScenario);
    setGameState({ ...gameState });
    setPendingFeedback({
      kind: choice.kind,
      text: choice.feedback,
      delta: result.delta,
    });
    const nextScene = gameScenario.scenes[result.nextSceneId];
    const isEnding = (nextScene && (nextScene as any).ending) || gameState.gameOver;
    if (isEnding) {
      const endingKind = ((nextScene as any)?.endingKind || (nextScene as any)?.kind || "mid") as "good" | "bad" | "mid";
      const score = computeCampaignScore(gameState, endingKind);
      setLastCampaignScore(score);
      saveCampaignScore(gameScenario.id, score).then(setCampaignScores);
      setTimeout(() => setRoute({ name: "outcome" }), 0);
    }
  };

  // ---------- ROUTE RENDER ----------
  let screen: React.ReactNode = null;
  const c = theme.colors;
  switch (route.name) {
    case "splash":
      screen = <SplashScreen colors={c}
        profile={profile}
        onPlay={() => {
          if (!profile) setRoute({ name: "profile-create" });
          else setRoute({ name: "home" });
        }}
      />;
      break;
    case "profile-create":
      screen = <ProfileCreateScreen colors={c}
        initialName={profile?.username}
        initialAvatarId={profile?.avatarId}
        initialAvatarUri={profile?.avatarUri}
        onSave={async (rawUsername: string, avatarId?: number, avatarUri?: string) => {
          const username = normalizeUsername(rawUsername);
          const isNew = !profile;
          const userId = profile?.userId ?? newUserId();

          if (SUPABASE_ENABLED) {
            if (isNew) {
              await registerUser(userId, username, avatarId);
            } else {
              // Same userId — rename is allowed freely. One row, updated in place.
              await updateProfileRow(userId, username, avatarId);
            }
          }

          const p: Profile = {
            userId,
            username,
            createdAt: profile?.createdAt ?? Date.now(),
            avatarId, avatarUri,
            lastUploadedAt: profile?.lastUploadedAt,
            lastUploadedPoints: profile?.lastUploadedPoints,
          };
          await saveProfile(p);
          setProfile(p);
          setRoute({ name: "home" });
        }}
      />;
      break;
    case "leaderboards":
      screen = <LeaderboardScreen colors={c}
        profile={profile}
        onUpdateProfile={async (p: Profile) => { await saveProfile(p); setProfile(p); }}
        onEditProfile={() => nav({ name: "profile-create" })}
        onOpenFriends={() => nav({ name: "friends" })}
      />;
      break;
    case "friends":
      screen = <FriendsScreen colors={c}
        profile={profile}
        onEditProfile={() => nav({ name: "profile-create" })}
      />;
      break;
    case "home":
      screen = <HomeScreen colors={c}
        overallPct={overallPct}
        quizScores={quizScores}
        campaignScores={campaignScores}
        onOpenLearn={() => nav({ name: "learn" })}
        onOpenPlay={() => nav({ name: "play" })}
      />;
      break;
    case "learn":
      screen = <LearnScreen colors={c} quizScores={quizScores} onPick={(id: string) => nav({ name: "learn-detail", scenarioId: id })} />;
      break;
    case "learn-detail":
      screen = <LearnDetailScreen colors={c}
        scenarioId={(route as any).scenarioId}
        quizScores={quizScores}
        onBack={() => nav({ name: "learn" })}
        onOpenQuiz={(trackId: string, quizId: string) => nav({ name: "quiz", trackId, quizId })}
      />;
      break;
    case "quiz": {
      const r = route as Extract<Route, { name: "quiz" }>;
      const pack = EDUCATION[r.trackId];
      const quiz = pack?.quizzes.find(q => q.id === r.quizId);
      if (pack && quiz) {
        screen = <QuizScreen colors={c} trackId={r.trackId} quiz={quiz}
          onFinish={async (score: number) => {
            const updated = await saveQuizScore(r.trackId, r.quizId, score);
            setQuizScores(updated);
            nav({ name: "learn-detail", scenarioId: r.trackId });
          }}
          onCancel={() => nav({ name: "learn-detail", scenarioId: r.trackId })}
        />;
      }
      break;
    }
    case "play":
      screen = <PlayScreen colors={c}
        levels={levels}
        onCampaign={(id: string) => nav({ name: "campaign-char-choice", scenarioId: id })}
        onCustomPlay={(lvl: CustomLevel) => nav({ name: "custom-level-char-choice", customId: lvl.id })}
        onOpenLevelDesign={() => nav({ name: "level-editor-list" })}
      />;
      break;
    case "campaign-char-choice": {
      const r = route as Extract<Route, { name: "campaign-char-choice" }>;
      screen = <CharacterPickScreen colors={c}
        title={SCENARIO_MAP[r.scenarioId]?.name || "Campaign"}
        subtitle="Who are you playing as?"
        defaultCharName={SCENARIO_MAP[r.scenarioId]?.defaultName || "Default"}
        characters={characters}
        onDefault={() => launchScenario({ scenarioId: r.scenarioId })}
        onPickCharacter={(ch: SavedCharacter) => launchScenario({ scenarioId: r.scenarioId, modifiers: ch.modifiers })}
        onCreateFirst={() => nav({ name: "characters-create", returnTo: r })}
        onCancel={() => nav({ name: "play" })}
      />;
      break;
    }
    case "custom-level-char-choice": {
      const r = route as Extract<Route, { name: "custom-level-char-choice" }>;
      const lvl = levels.find(l => l.id === r.customId);
      screen = <CharacterPickScreen colors={c}
        title={lvl?.name || "Custom Level"}
        subtitle="Who are you playing as?"
        defaultCharName={lvl?.defaultName || "Default"}
        characters={characters}
        onDefault={() => launchScenario({ scenarioId: r.customId, isCustom: true })}
        onPickCharacter={(ch: SavedCharacter) => launchScenario({ scenarioId: r.customId, isCustom: true, modifiers: ch.modifiers })}
        onCreateFirst={() => nav({ name: "characters-create", returnTo: r })}
        onCancel={() => nav({ name: "play" })}
      />;
      break;
    }
    case "characters-create": {
      const r = route as Extract<Route, { name: "characters-create" }>;
      const backTo: Route = r.returnTo ?? { name: "characters" };
      screen = <CharacterCreatorScreen colors={c}
        existing={characters}
        onPickPreset={async (presetKey: string) => {
          const preset = CHARACTER_PRESETS.find(p => p.key === presetKey);
          if (!preset) return;
          const c2: SavedCharacter = {
            id: newCharacterId(),
            name: nextCharacterName(characters, preset.name),
            modifiers: [...preset.mods],
            presetKey,
            createdAt: Date.now(),
          };
          await upsertCharacter(c2);
          setCharacters(await loadCharacters());
          nav(backTo);
        }}
        onCustom={() => nav({ name: "characters-create-custom", returnTo: backTo })}
        onCancel={() => nav(backTo)}
      />;
      break;
    }
    case "characters-create-custom": {
      const r = route as Extract<Route, { name: "characters-create-custom" }>;
      const backTo: Route = r.returnTo ?? { name: "characters" };
      screen = <CustomCharacterCreatorScreen colors={c}
        existing={characters}
        onSave={async (name: string, mods: string[]) => {
          const c2: SavedCharacter = {
            id: newCharacterId(),
            name: name || nextCharacterName(characters, "Custom"),
            modifiers: mods,
            presetKey: "custom",
            createdAt: Date.now(),
          };
          await upsertCharacter(c2);
          setCharacters(await loadCharacters());
          nav(backTo);
        }}
        onCancel={() => nav({ name: "characters-create", returnTo: backTo })}
      />;
      break;
    }
    case "game":
      if (gameState && gameScenario) {
        screen = <GameScreen colors={c}
          state={gameState} scenario={gameScenario} feedback={pendingFeedback}
          onPick={onChoicePicked}
          onBack={() => nav({ name: "play" })}
        />;
      }
      break;
    case "outcome":
      if (gameState && gameScenario) {
        screen = <OutcomeScreen colors={c}
          state={gameState} scenario={gameScenario}
          finalScore={lastCampaignScore}
          eduPack={levels.find(l => l.id === gameScenario.id) ? customLevelToEducation(levels.find(l => l.id === gameScenario.id)!) : EDUCATION[gameScenario.id]}
          onHome={() => nav({ name: "home" })}
          onPlay={() => nav({ name: "play" })}
        />;
      }
      break;
    case "tools":
      screen = <ToolsScreen colors={c}
        onOpenBudget={() => nav({ name: "tool-budget" })}
        onOpenLease={() => nav({ name: "tool-lease" })}
        onOpenTaxDocs={() => nav({ name: "tool-taxdocs" })}
      />;
      break;
    case "tool-budget":
      screen = <BudgetBuilderScreen colors={c} onBack={() => nav({ name: "tools" })} />;
      break;
    case "tool-lease":
      screen = <LeaseChecklistScreen colors={c} onBack={() => nav({ name: "tools" })} />;
      break;
    case "tool-taxdocs":
      screen = <TaxTrackerScreen colors={c} onBack={() => nav({ name: "tools" })} />;
      break;
    case "progress":
      screen = <ProgressScreen colors={c}
        quizScores={quizScores}
        campaignScores={campaignScores}
        levels={levels}
        characters={characters}
        overallPct={overallPct}
      />;
      break;
    case "settings":
      screen = <SettingsScreen colors={c} theme={theme}
        profile={profile}
        onEditProfile={() => nav({ name: "profile-create" })}
        onDataChanged={async () => {
          setQuizScores(await loadQuizScores());
          setCampaignScores(await loadCampaignScores());
          setLevels(await loadLevels());
          setCharacters(await loadCharacters());
        }}
        onAfterReset={async () => {
          // Wipe local state, clear profile from memory, send user to account creation.
          setQuizScores({});
          setCampaignScores({});
          setLevels([]);
          setCharacters([]);
          setProfile(null);
          setRoute({ name: "profile-create" });
        }}
      />;
      break;
    case "characters":
      screen = <CharactersScreen colors={c}
        characters={characters}
        onAdd={() => nav({ name: "characters-create" })}
        onDelete={async (id: string) => { await removeCharacter(id); setCharacters(await loadCharacters()); }}
      />;
      break;
    case "level-editor-list":
      screen = <LevelEditorList colors={c}
        levels={levels}
        onRefresh={async () => setLevels(await loadLevels())}
        onEdit={(id: string) => nav({ name: "level-editor", levelId: id })}
        onPlay={(lvl: CustomLevel) => nav({ name: "custom-level-char-choice", customId: lvl.id })}
      />;
      break;
    case "level-editor":
      screen = <LevelEditorScreen colors={c}
        levelId={(route as any).levelId}
        onDone={async () => { setLevels(await loadLevels()); nav({ name: "level-editor-list" }); }}
      />;
      break;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: route.name === "splash" ? "#333333" : c.background }}>
      <StatusBar barStyle={theme.resolved === "dark" ? "light-content" : "dark-content"} backgroundColor={c.background} />
      <View style={{ flex: 1 }}>
        {screen}
      </View>
      {route.name !== "splash" && route.name !== "profile-create" && (
        <>
          <BottomTabs colors={c} route={route} onNav={nav} onMore={() => setMoreOpen(v => !v)} moreActive={moreOpen} />
          <MoreDropdown
            visible={moreOpen} onClose={() => setMoreOpen(false)} colors={c}
            onPick={(where: string) => { setMoreOpen(false); nav({ name: where as any }); }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

// ============================================================
// BOTTOM TAB BAR
// ============================================================
// ============================================================
// SPLASH SCREEN — shown on app boot until user taps Play
// ============================================================
function DottedBackdrop({ color, dotColor, spacing = 18, dotSize = 2, offsetX = 0 }: { color: string; dotColor: string; spacing?: number; dotSize?: number; offsetX?: number }) {
  const { width, height } = Dimensions.get("window");
  const dots = useMemo(() => {
    const out: React.ReactNode[] = [];
    const startX = spacing + offsetX;
    for (let y = spacing; y < height; y += spacing) {
      for (let x = startX; x < width; x += spacing) {
        out.push(
          <View key={`${x}-${y}`} style={{
            position: "absolute", left: x, top: y,
            width: dotSize, height: dotSize, borderRadius: dotSize / 2,
            backgroundColor: dotColor, opacity: 0.55,
          }} />
        );
      }
    }
    return out;
  }, [width, height, spacing, dotSize, dotColor, offsetX]);
  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: color }]} pointerEvents="none">
      {dots}
    </View>
  );
}

function SplashScreen({ colors, onPlay, profile }: any) {
  // Dark charcoal that matches the drawing's own edge grey so the letterbox
  // blends seamlessly with the image.
  const bgGrey = "#333333";
  const dotColor = "#5c5c5c";
  return (
    <View style={{ flex: 1, backgroundColor: bgGrey }}>
      <DottedBackdrop color={bgGrey} dotColor={dotColor} spacing={22.2} dotSize={2.5} offsetX={-27}/>

      {/* Image anchored flush with the bottom, scaled up ~15% by stretching
          the wrapper 7.5% past each screen edge. */}
      <View style={{
        position: "absolute", bottom: 0, left: "-7.5%", right: "-7.5%",
        aspectRatio: 528 / 478,
      }} pointerEvents="none">
        <Image
          source={require("./assets/splash-bg.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>

      {/* Overlay content sits above the image */}
      <View style={{ flex: 1, alignItems: "center", paddingTop: 60 }}>
        {profile?.username && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10,
            backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
            <AvatarDisplay colors={colors} avatarId={profile.avatarId} avatarUri={profile.avatarUri} name={profile.username} size={28} />
            <Text style={{ color: "#d8d8d8", fontFamily: "Inter_500Medium", fontSize: 13 }}>
              Signed in as <Text style={{ color: "white", fontFamily: "Inter_700Bold" }}>{profile.username}</Text>
            </Text>
          </View>
        )}

        <View style={{ alignItems: "center", marginTop: profile?.username ? 22 : 40 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end",
            backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 18, paddingVertical: 6, borderRadius: 14 }}>
            <Text style={{ fontSize: 44, fontFamily: "Inter_800ExtraBold", color: "white", letterSpacing: -1 }}>Next</Text>
            <View style={{ width: 6 }} />
            <Text style={{ fontSize: 44, fontFamily: "Inter_800ExtraBold", color: colors.primary, letterSpacing: -1 }}>Step</Text>
          </View>
          <View style={{ marginTop: 4 }}>
            <Feather name="chevron-down" size={22} color={colors.primary} />
          </View>
        </View>

        <Pressable onPress={onPlay} style={({ pressed }) => ({
          width: 140, height: 140, borderRadius: 70,
          backgroundColor: colors.primary,
          alignItems: "center", justifyContent: "center",
          shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
          elevation: 14,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          marginTop: 20,
          borderWidth: 4, borderColor: "rgba(255,255,255,0.15)",
        })}>
          <Feather name="play" size={60} color="white" style={{ marginLeft: 6 }} />
        </Pressable>

        <View style={{ flex: 1 }} />

        <Text style={{
          marginBottom: 30, color: "#dcdcdc",
          fontFamily: "Inter_500Medium", fontSize: 13,
          backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
        }}>
          Real decisions · Real consequences
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// PROFILE CREATE — shown on first launch and after reset
// ============================================================
function ProfileCreateScreen({ colors, onSave, initialName, initialAvatarId, initialAvatarUri }: any) {
  const [name, setName] = useState<string>(initialName || "");
  const [avatarId, setAvatarId] = useState<number | undefined>(initialAvatarId);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(initialAvatarUri);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remoteErr, setRemoteErr] = useState<string | null>(null);
  const err = validateUsername(name);

  const handleSave = async () => {
    if (err) return;
    const trimmed = name.trim();
    setSubmitting(true);
    setRemoteErr(null);
    try {
      await onSave(trimmed, avatarId, avatarUri);
    } catch (e: any) {
      setRemoteErr(e?.message || String(e));
      setSubmitting(false);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Camera needed", "Enable camera access in Settings to take a profile photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarId(undefined); // custom photo replaces preset
      setPickerOpen(false);
    }
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Photos needed", "Enable photo library access in Settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarId(undefined);
      setPickerOpen(false);
    }
  };

  const selectPreset = (id: number) => {
    setAvatarId(id);
    setAvatarUri(undefined); // preset replaces custom
    setPickerOpen(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Pressable onPress={() => setPickerOpen(true)} style={{ position: "relative" }}>
            <AvatarDisplay colors={colors} avatarId={avatarId} avatarUri={avatarUri} name={name} size={96} />
            <View style={{
              position: "absolute", right: -4, bottom: -4,
              width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary,
              alignItems: "center", justifyContent: "center",
              borderWidth: 3, borderColor: colors.background,
            }}>
              <Feather name="camera" size={14} color="white" />
            </View>
          </Pressable>
          <Text style={[styles.h1, { color: colors.foreground, textAlign: "center", fontSize: 26, marginTop: 14 }]}>
            {initialName ? "Update your account" : "Make an account"}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground, textAlign: "center", marginTop: 4 }]}>
            Tap the picture to pick a preset or take a photo. Profile saves locally; {SUPABASE_ENABLED ? "your username is reserved on the leaderboard." : "leaderboard sync needs Supabase."}
          </Text>
        </View>

        <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.setupLabel, { color: colors.foreground }]}>Username</Text>
          <Text style={[styles.setupQ, { color: colors.mutedForeground }]}>2–24 characters. Letters, numbers, spaces, _ and - only.</Text>
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); setRemoteErr(null); }}
            placeholder="e.g. AlexRivers"
            placeholderTextColor={colors.mutedForeground}
            autoFocus
            maxLength={24}
            editable={!submitting}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            style={{
              backgroundColor: colors.muted, color: colors.foreground,
              borderWidth: 1,
              borderColor: (err && name.length > 0) || remoteErr ? colors.destructive : colors.border,
              borderRadius: 10, padding: 12, fontSize: 16, fontFamily: "Inter_600SemiBold", marginTop: 6,
            }}
          />
          {err && name.length > 0 && (
            <Text style={{ color: colors.destructive, fontSize: 12, marginTop: 6, fontFamily: "Inter_600SemiBold" }}>{err}</Text>
          )}
          {remoteErr && (
            <Text style={{ color: colors.destructive, fontSize: 13, marginTop: 6, fontFamily: "Inter_600SemiBold", lineHeight: 18 }}>
              {remoteErr}
            </Text>
          )}
        </View>

        <Pressable
          disabled={!!err || submitting}
          onPress={handleSave}
          style={[styles.bigCta, { backgroundColor: (err || submitting) ? colors.muted : colors.primary, marginTop: 10 }]}
        >
          <Feather name={submitting ? "loader" : "arrow-right"} size={20} color={(err || submitting) ? colors.mutedForeground : "white"} />
          <Text style={[styles.bigCtaText, { color: (err || submitting) ? colors.mutedForeground : "white" }]}>
            {submitting ? "Checking availability..." : (initialName ? "Update" : "Continue")}
          </Text>
        </Pressable>
      </ScrollView>

      <AvatarPickerModal
        visible={pickerOpen}
        colors={colors}
        selectedId={avatarId}
        onSelectPreset={selectPreset}
        onTakePhoto={takePhoto}
        onPickLibrary={pickFromLibrary}
        onClose={() => setPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

// Renders either a custom photo URI, a preset avatar, or a letter fallback.
function AvatarDisplay({ colors, avatarId, avatarUri, name, size = 40 }: any) {
  if (avatarUri) {
    return <Image source={{ uri: avatarUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const preset = getPresetSource(avatarId);
  if (preset) {
    return <Image source={preset} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />;
  }
  const letter = (name && name.length > 0) ? name[0].toUpperCase() : "?";
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: size * 0.42 }}>{letter}</Text>
    </View>
  );
}

function AvatarPickerModal({ visible, colors, selectedId, onSelectPreset, onTakePhoto, onPickLibrary, onClose }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{
          marginTop: "auto", backgroundColor: colors.background,
          borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36,
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={[styles.h1, { color: colors.foreground, fontSize: 22 }]}>Choose a picture</Text>
            <Pressable onPress={onClose}><Feather name="x" size={24} color={colors.mutedForeground} /></Pressable>
          </View>

          <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground, marginTop: 0, marginBottom: 10 }]}>PRESETS</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
            {AVATAR_PRESETS.map(p => {
              const selected = selectedId === p.id;
              return (
                <Pressable key={p.id} onPress={() => onSelectPreset(p.id)} style={{
                  alignItems: "center", gap: 6, width: "22%",
                }}>
                  <View style={{
                    borderRadius: 40, padding: 3,
                    borderWidth: 3, borderColor: selected ? colors.primary : "transparent",
                  }}>
                    <Image source={p.source} style={{ width: 64, height: 64, borderRadius: 32 }} resizeMode="cover" />
                  </View>
                  <Text style={{ color: colors.foreground, fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" }} numberOfLines={1}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground, marginBottom: 10 }]}>OR USE YOUR OWN</Text>
          <Pressable onPress={onTakePhoto} style={[styles.bigCta, { backgroundColor: colors.primary, marginBottom: 8 }]}>
            <Feather name="camera" size={18} color="white" />
            <Text style={styles.bigCtaText}>Take a photo</Text>
          </Pressable>
          <Pressable onPress={onPickLibrary} style={[styles.bigCta, { backgroundColor: colors.muted }]}>
            <Feather name="image" size={18} color={colors.foreground} />
            <Text style={[styles.bigCtaText, { color: colors.foreground }]}>Pick from library</Text>
          </Pressable>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 10, textAlign: "center", fontFamily: "Inter_400Regular" }}>
            Custom photos stay on your device. Presets appear on the leaderboard next to your name.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================
// LEADERBOARDS
// ============================================================
function LeaderboardScreen({ colors, profile, onEditProfile, onUpdateProfile, onOpenFriends }: any) {
  const [mode, setMode] = useState<"global" | "friends">("global");
  const [points, setPoints] = useState<PointsBreakdown | null>(null);
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true); setError(null);
      const [pts, top] = await Promise.all([
        computeTotalPoints(),
        SUPABASE_ENABLED ? fetchTopScores(50) : Promise.resolve([]),
      ]);
      setPoints(pts);
      setRows(top);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const upload = async () => {
    if (!profile) { onEditProfile(); return; }
    if (!points) return;
    try {
      setUploading(true); setError(null);
      await uploadScore(profile.userId, profile.username, points.total, profile.avatarId);
      const updated: Profile = { ...profile, lastUploadedAt: Date.now(), lastUploadedPoints: points.total };
      await onUpdateProfile(updated);
      await refresh();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally { setUploading(false); }
  };

  const rank = rows && profile
    ? rows.findIndex(r => r.user_id === profile.userId) + 1
    : 0;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>LEADERBOARDS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Your score, ranked</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 16 }]}>
        Points come from campaign scores, lesson quizzes, and custom-level best runs.
      </Text>

      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroLabel}>YOUR TOTAL POINTS</Text>
        <Text style={{ color: "white", fontSize: 48, fontFamily: "Inter_800ExtraBold", textAlign: "center", marginTop: 4 }}>
          {points?.total ?? 0}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", textAlign: "center", fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 }}>
          {profile?.username ? profile.username : "No profile yet"}
        </Text>
        {points && (
          <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 14 }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: 18 }}>{points.campaignPoints}</Text>
              <Text style={styles.heroSubLabel}>Campaigns</Text>
            </View>
            <View style={styles.heroDiv} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: 18 }}>{points.lessonPoints}</Text>
              <Text style={styles.heroSubLabel}>Lessons</Text>
            </View>
            <View style={styles.heroDiv} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: 18 }}>{points.customPoints}</Text>
              <Text style={styles.heroSubLabel}>Customs</Text>
            </View>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <Pressable
          disabled={uploading || !SUPABASE_ENABLED}
          style={[styles.bigCta, { backgroundColor: SUPABASE_ENABLED ? colors.primary : colors.muted, flex: 1 }]}
          onPress={upload}
        >
          <Feather name="upload-cloud" size={18} color={SUPABASE_ENABLED ? "white" : colors.mutedForeground} />
          <Text style={[styles.bigCtaText, { color: SUPABASE_ENABLED ? "white" : colors.mutedForeground }]}>
            {uploading ? "Uploading..." : "Upload my score"}
          </Text>
        </Pressable>
        <Pressable style={[styles.bigCta, { backgroundColor: colors.muted, paddingHorizontal: 14 }]} onPress={onEditProfile}>
          <Feather name="edit-2" size={16} color={colors.foreground} />
          <Text style={[styles.bigCtaText, { color: colors.foreground, fontSize: 13 }]}>Profile</Text>
        </Pressable>
      </View>

      {!SUPABASE_ENABLED && (
        <View style={[styles.lessonCard, { backgroundColor: colors.warningSoft, borderColor: colors.warning, borderLeftColor: colors.warning, marginTop: 10 }]}>
          <Text style={[styles.lessonT, { color: colors.warning }]}>Supabase not configured</Text>
          <Text style={[styles.lessonD, { color: colors.warning }]}>
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env and restart Metro. See README.
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.lessonCard, { backgroundColor: colors.destructiveSoft, borderColor: colors.destructive, borderLeftColor: colors.destructive, marginTop: 10 }]}>
          <Text style={[styles.lessonT, { color: colors.destructive }]}>Something went wrong</Text>
          <Text style={[styles.lessonD, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
        <Pressable onPress={() => setMode("global")} style={[styles.segItem, { flex: 1, backgroundColor: mode === "global" ? colors.primary : colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={{ color: mode === "global" ? "white" : colors.foreground, fontFamily: "Inter_700Bold", fontSize: 13 }}>🌎 Global</Text>
        </Pressable>
        <Pressable onPress={() => setMode("friends")} style={[styles.segItem, { flex: 1, backgroundColor: mode === "friends" ? colors.primary : colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={{ color: mode === "friends" ? "white" : colors.foreground, fontFamily: "Inter_700Bold", fontSize: 13 }}>🤝 Friends</Text>
        </Pressable>
        <Pressable onPress={onOpenFriends} style={[styles.segItem, { backgroundColor: colors.muted, borderRadius: 10, paddingHorizontal: 14 }]}>
          <Feather name="user-plus" size={16} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18, marginBottom: 10 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{mode === "friends" ? "Friends only" : "Top players"}</Text>
        <Pressable onPress={refresh} hitSlop={8}>
          <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {loading ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_500Medium" }}>Loading…</Text>
      ) : (() => {
          const myFriends = rows?.find(r => r.user_id === profile?.userId)?.friends || [];
          const visible = mode === "friends"
            ? (rows || []).filter(r => myFriends.includes(r.user_id) || r.user_id === profile?.userId)
            : (rows || []);
          if (visible.length === 0) {
            return <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_500Medium" }}>
              {mode === "friends" ? "No friends yet. Tap the user-plus icon above to add one by their ID." : (SUPABASE_ENABLED ? "No scores yet. Be the first to upload!" : "Configure Supabase to view rankings.")}
            </Text>;
          }
          return visible.map((r, i) => {
          const isMe = profile && r.user_id === profile.userId;
          return (
            <View key={r.user_id} style={{
              flexDirection: "row", alignItems: "center",
              padding: 12, marginBottom: 6, borderRadius: 12,
              backgroundColor: isMe ? colors.primarySoft : colors.card,
              borderWidth: 1, borderColor: isMe ? colors.primary : colors.border,
            }}>
              <Text style={{
                width: 28, fontFamily: "Inter_800ExtraBold", fontSize: 18,
                color: i === 0 ? "#FFB800" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : colors.mutedForeground,
              }}>
                {i + 1}
              </Text>
              <View style={{ marginRight: 10 }}>
                <AvatarDisplay
                  colors={colors}
                  avatarId={r.avatar_id ?? undefined}
                  avatarUri={isMe ? profile?.avatarUri : undefined}
                  name={r.username}
                  size={36}
                />
              </View>
              <Text style={{ flex: 1, fontFamily: "Inter_700Bold", color: colors.foreground, fontSize: 15 }} numberOfLines={1}>
                {r.username}{isMe ? "  (you)" : ""}
              </Text>
              <Text style={{ color: colors.foreground, fontFamily: "Inter_800ExtraBold", fontSize: 18 }}>{r.points}</Text>
            </View>
          );
        });
        })()}

      {rank > 0 && (
        <Text style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 12, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
          You're ranked #{rank} of {rows!.length} uploaded players.
        </Text>
      )}
    </ScrollView>
  );
}

// ============================================================
// QUIZ SCREEN — reading + multiple-choice questions + score
// ============================================================
// ============================================================
// FRIENDS — your ID (copyable), requests in/out, friends list
// ============================================================
function FriendsScreen({ colors, profile, onEditProfile }: any) {
  const [me, setMe] = useState<LeaderboardRow | null>(null);
  const [requesters, setRequesters] = useState<LeaderboardRow[]>([]);
  const [friendRows, setFriendRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputId, setInputId] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ kind: "good" | "bad"; text: string } | null>(null);

  const refresh = async () => {
    if (!profile || !SUPABASE_ENABLED) return;
    setLoading(true);
    try {
      const myRow = await fetchUserById(profile.userId);
      setMe(myRow);
      const reqIds = myRow?.friend_requests || [];
      const friendIds = myRow?.friends || [];
      const [reqs, fr] = await Promise.all([fetchUsersByIds(reqIds), fetchUsersByIds(friendIds)]);
      setRequesters(reqs);
      setFriendRows(fr.sort((a, b) => b.points - a.points));
    } catch (e: any) {
      setStatusMsg({ kind: "bad", text: e?.message || String(e) });
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const sendRequest = async () => {
    if (!profile) return;
    const targetId = inputId.trim();
    if (!targetId) return;
    try {
      await sendFriendRequest(targetId, profile.userId);
      setStatusMsg({ kind: "good", text: "Friend request sent!" });
      setInputId("");
    } catch (e: any) {
      setStatusMsg({ kind: "bad", text: e?.message || String(e) });
    }
  };

  const accept = async (otherId: string) => {
    if (!profile) return;
    try {
      await acceptFriendRequest(profile.userId, otherId);
      setStatusMsg({ kind: "good", text: "Friend added." });
      await refresh();
    } catch (e: any) { setStatusMsg({ kind: "bad", text: e?.message || String(e) }); }
  };
  const decline = async (otherId: string) => {
    if (!profile) return;
    try {
      await declineFriendRequest(profile.userId, otherId);
      await refresh();
    } catch (e: any) { setStatusMsg({ kind: "bad", text: e?.message || String(e) }); }
  };
  const unfriend = async (otherId: string) => {
    if (!profile) return;
    try {
      await removeFriend(profile.userId, otherId);
      await refresh();
    } catch (e: any) { setStatusMsg({ kind: "bad", text: e?.message || String(e) }); }
  };

  if (!profile) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>FRIENDS</Text>
        <Text style={[styles.h1, { color: colors.foreground }]}>Make an account first</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>You need a profile before sending friend requests.</Text>
        <Pressable style={[styles.bigCta, { backgroundColor: colors.primary }]} onPress={onEditProfile}>
          <Feather name="user" size={18} color="white" />
          <Text style={styles.bigCtaText}>Create profile</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (!SUPABASE_ENABLED) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>FRIENDS</Text>
        <Text style={[styles.h1, { color: colors.foreground }]}>Needs Supabase</Text>
        <View style={[styles.lessonCard, { backgroundColor: colors.warningSoft, borderColor: colors.warning, borderLeftColor: colors.warning, marginTop: 10 }]}>
          <Text style={[styles.lessonT, { color: colors.warning }]}>Not configured</Text>
          <Text style={[styles.lessonD, { color: colors.warning }]}>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env to enable friends.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>FRIENDS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Your crew</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 16 }]}>
        Share your ID, send requests, compete on the friends leaderboard.
      </Text>

      {/* Your ID */}
      <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setupLabel, { color: colors.foreground }]}>Your user ID</Text>
        <Text style={[styles.setupQ, { color: colors.mutedForeground }]}>Share this with a friend so they can add you.</Text>
        <Pressable
          onPress={async () => {
            await Clipboard.setStringAsync(profile.userId);
            setStatusMsg({ kind: "good", text: "User ID copied to clipboard." });
          }}
          style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border,
            borderRadius: 10, padding: 12, marginTop: 6,
          }}
        >
          <Text selectable style={{
            flex: 1, color: colors.foreground,
            fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
          }}>
            {profile.userId}
          </Text>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
          }}>
            <Feather name="copy" size={14} color="white" />
            <Text style={{ color: "white", fontFamily: "Inter_700Bold", fontSize: 12 }}>Copy</Text>
          </View>
        </Pressable>
      </View>

      {/* Add friend */}
      <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setupLabel, { color: colors.foreground }]}>Add a friend</Text>
        <Text style={[styles.setupQ, { color: colors.mutedForeground }]}>Paste their user ID below, then tap send.</Text>
        <TextInput
          value={inputId}
          onChangeText={setInputId}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="e.g. 7a3f2b8c-..."
          placeholderTextColor={colors.mutedForeground}
          style={{
            backgroundColor: colors.muted, color: colors.foreground,
            borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12,
            fontSize: 13, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginTop: 6, marginBottom: 10,
          }}
        />
        <Pressable style={[styles.bigCta, { backgroundColor: inputId.trim() ? colors.primary : colors.muted }]} onPress={sendRequest} disabled={!inputId.trim()}>
          <Feather name="send" size={18} color={inputId.trim() ? "white" : colors.mutedForeground} />
          <Text style={[styles.bigCtaText, { color: inputId.trim() ? "white" : colors.mutedForeground }]}>Send request</Text>
        </Pressable>
      </View>

      {statusMsg && (
        <View style={[styles.lessonCard, {
          backgroundColor: statusMsg.kind === "good" ? colors.successSoft : colors.destructiveSoft,
          borderColor: statusMsg.kind === "good" ? colors.success : colors.destructive,
          borderLeftColor: statusMsg.kind === "good" ? colors.success : colors.destructive,
        }]}>
          <Text style={[styles.lessonT, { color: statusMsg.kind === "good" ? colors.success : colors.destructive }]}>{statusMsg.text}</Text>
        </View>
      )}

      {/* Incoming requests */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18, marginBottom: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Requests ({requesters.length})</Text>
        <Pressable onPress={refresh} hitSlop={8}><Feather name="refresh-cw" size={16} color={colors.mutedForeground} /></Pressable>
      </View>
      {requesters.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" }}>No pending requests.</Text>
      ) : requesters.map(r => (
        <View key={r.user_id} style={{ flexDirection: "row", alignItems: "center", padding: 12, marginBottom: 6, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
          <AvatarDisplay colors={colors} avatarId={r.avatar_id ?? undefined} name={r.username} size={36} />
          <Text style={{ flex: 1, color: colors.foreground, fontFamily: "Inter_700Bold" }} numberOfLines={1}>{r.username}</Text>
          <Pressable onPress={() => accept(r.user_id)} style={{ backgroundColor: colors.success, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: "white", fontFamily: "Inter_700Bold", fontSize: 12 }}>Accept</Text>
          </Pressable>
          <Pressable onPress={() => decline(r.user_id)} style={{ backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 12 }}>Decline</Text>
          </Pressable>
        </View>
      ))}

      {/* Friends list */}
      <View style={{ marginTop: 18, marginBottom: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Friends ({friendRows.length})</Text>
      </View>
      {friendRows.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" }}>No friends yet. Ask someone for their user ID.</Text>
      ) : friendRows.map(r => (
        <View key={r.user_id} style={{ flexDirection: "row", alignItems: "center", padding: 12, marginBottom: 6, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
          <AvatarDisplay colors={colors} avatarId={r.avatar_id ?? undefined} name={r.username} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold" }} numberOfLines={1}>{r.username}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_500Medium" }}>{r.points} pts</Text>
          </View>
          <Pressable onPress={() => unfriend(r.user_id)} hitSlop={8}>
            <Feather name="user-minus" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function QuizScreen({ colors, trackId, quiz, onFinish, onCancel }: any) {
  // step -1 = reading, 0..N-1 = question i, N = results
  const [step, setStep] = useState<number>(-1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const total = quiz.questions.length;

  if (step === -1) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Pressable onPress={onCancel} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Feather name="chevron-left" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Back</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.secondary }]}>READING · {total} QUESTIONS AFTER</Text>
        <Text style={[styles.h1, { color: colors.foreground }]}>{quiz.title}</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 16 }]}>{quiz.summary}</Text>
        <View style={[styles.sceneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontSize: 15, lineHeight: 23, fontFamily: "Inter_400Regular" }}>
            {quiz.reading}
          </Text>
        </View>
        <Pressable style={[styles.bigCta, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => setStep(0)}>
          <Feather name="arrow-right" size={20} color="white" />
          <Text style={styles.bigCtaText}>Start Quiz</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (step >= total) {
    // Results
    const correct = quiz.questions.reduce((n: number, q: any, i: number) => n + (answers[i] === q.correctIdx ? 1 : 0), 0);
    const score = Math.round((correct / total) * 100);
    const sColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.destructive;
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View style={[styles.endingCard, { backgroundColor: colors.card, borderColor: sColor }]}>
          <Text style={[styles.eyebrow, { color: sColor, textAlign: "center" }]}>QUIZ COMPLETE</Text>
          <Text style={{ fontSize: 56, fontFamily: "Inter_800ExtraBold", color: sColor, textAlign: "center", marginVertical: 10 }}>{score}</Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: "center", fontFamily: "Inter_500Medium" }}>
            {correct} of {total} correct · {score >= 80 ? "Strong work." : score >= 60 ? "Passing. Review and try again." : "Keep studying."}
          </Text>
        </View>
        <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>REVIEW</Text>
        {quiz.questions.map((q: any, i: number) => {
          const picked = answers[i];
          const got = picked === q.correctIdx;
          return (
            <View key={i} style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: got ? colors.success : colors.destructive }]}>
              <Text style={[styles.lessonT, { color: colors.foreground }]}>
                {got ? "✓" : "✗"} {q.q}
              </Text>
              <Text style={{ fontSize: 13, color: picked === q.correctIdx ? colors.success : colors.destructive, marginTop: 4, fontFamily: "Inter_600SemiBold" }}>
                Your answer: {q.choices[picked] || "(skipped)"}
              </Text>
              {!got && (
                <Text style={{ fontSize: 13, color: colors.success, marginTop: 2, fontFamily: "Inter_600SemiBold" }}>
                  Correct: {q.choices[q.correctIdx]}
                </Text>
              )}
              <Text style={[styles.lessonD, { color: colors.mutedForeground, marginTop: 6 }]}>{q.explain}</Text>
            </View>
          );
        })}
        <Pressable style={[styles.bigCta, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => onFinish(score)}>
          <Feather name="check" size={20} color="white" />
          <Text style={styles.bigCtaText}>Save & Done</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Active question
  const q = quiz.questions[step];
  const picked = answers[step];
  const isRevealed = revealed[step];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Pressable onPress={onCancel} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Feather name="x" size={20} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Exit</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: colors.secondary }]}>QUESTION {step + 1} OF {total}</Text>
      <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 6, marginTop: 6, marginBottom: 16, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${((step + 1) / total) * 100}%`, backgroundColor: colors.primary }} />
      </View>
      <View style={[styles.sceneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ fontSize: 18, lineHeight: 26, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{q.q}</Text>
      </View>
      {q.choices.map((c: string, i: number) => {
        const isPicked = picked === i;
        const isCorrect = i === q.correctIdx;
        let bg = colors.card, borderColor = colors.border, fg = colors.foreground;
        if (isRevealed) {
          if (isCorrect) { bg = colors.successSoft; borderColor = colors.success; fg = colors.success; }
          else if (isPicked) { bg = colors.destructiveSoft; borderColor = colors.destructive; fg = colors.destructive; }
        } else if (isPicked) {
          bg = colors.primarySoft; borderColor = colors.primary;
        }
        return (
          <Pressable
            key={i}
            disabled={isRevealed}
            onPress={() => setAnswers({ ...answers, [step]: i })}
            style={[styles.choiceBtn, { backgroundColor: bg, borderColor }]}
          >
            <Text style={[styles.choiceLetter, { color: colors.primary }]}>[{"ABCDEFGH"[i]}]</Text>
            <Text style={[styles.choiceLabel, { color: fg }]}>{c}</Text>
          </Pressable>
        );
      })}

      {isRevealed ? (
        <>
          <View style={[styles.feedback, {
            backgroundColor: picked === q.correctIdx ? colors.successSoft : colors.destructiveSoft,
            borderColor: picked === q.correctIdx ? colors.success : colors.destructive,
          }]}>
            <Text style={{
              color: picked === q.correctIdx ? colors.success : colors.destructive,
              fontFamily: "Inter_800ExtraBold", fontSize: 11, letterSpacing: 1.2,
            }}>
              {picked === q.correctIdx ? "✓ CORRECT" : "✗ INCORRECT"}
            </Text>
            <Text style={{
              color: picked === q.correctIdx ? colors.success : colors.destructive,
              marginTop: 4, fontSize: 14, lineHeight: 20,
            }}>
              {q.explain}
            </Text>
          </View>
          <Pressable
            style={[styles.bigCta, { backgroundColor: colors.primary, marginTop: 6 }]}
            onPress={() => setStep(step + 1)}
          >
            <Feather name={step + 1 >= total ? "check" : "arrow-right"} size={20} color="white" />
            <Text style={styles.bigCtaText}>{step + 1 >= total ? "See Results" : "Next"}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          disabled={picked === undefined}
          style={[styles.bigCta, { backgroundColor: picked !== undefined ? colors.primary : colors.muted, marginTop: 6 }]}
          onPress={() => setRevealed({ ...revealed, [step]: true })}
        >
          <Feather name="check" size={20} color={picked !== undefined ? "white" : colors.mutedForeground} />
          <Text style={[styles.bigCtaText, { color: picked !== undefined ? "white" : colors.mutedForeground }]}>Check Answer</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function BottomTabs({ colors, route, onNav, onMore, moreActive }: any) {
  const isActive = (names: string[]) => names.includes(route.name);
  const items = [
    { key: "home", label: "Home", icon: "home", active: isActive(["home"]), onPress: () => onNav({ name: "home" }) },
    { key: "learn", label: "Learn", icon: "book-open", active: isActive(["learn", "learn-detail", "quiz"]), onPress: () => onNav({ name: "learn" }) },
    { key: "play", label: "Play", icon: "play-circle", active: isActive(["play", "campaign-char-choice", "custom-level-char-choice", "game", "outcome", "level-editor", "level-editor-list"]), onPress: () => onNav({ name: "play" }) },
    { key: "leaderboards", label: "Boards", icon: "award", active: isActive(["leaderboards"]), onPress: () => onNav({ name: "leaderboards" }) },
    { key: "more", label: "More", icon: "more-horizontal", active: moreActive || isActive(["tools", "tool-budget", "tool-lease", "tool-taxdocs", "progress", "settings", "characters", "characters-create", "characters-create-custom", "friends"]), onPress: onMore },
  ];
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {items.map(item => (
        <Pressable key={item.key} style={styles.tabItem} onPress={item.onPress}>
          <Feather name={item.icon as any} size={22} color={item.active ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.tabLabel, { color: item.active ? colors.primary : colors.mutedForeground }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ============================================================
// MORE DROPDOWN (the fixed version — all 4 items including Characters)
// ============================================================
function MoreDropdown({ visible, onClose, colors, onPick }: any) {
  const items = [
    { key: "tools", label: "Tools", icon: "tool" },
    { key: "progress", label: "Progress", icon: "bar-chart-2" },
    { key: "characters", label: "Characters", icon: "users" },
    { key: "friends", label: "Friends", icon: "user-plus" },
    { key: "settings", label: "Settings", icon: "settings" },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {items.map((it, i) => (
            <Pressable
              key={it.key}
              onPress={() => onPick(it.key)}
              style={[
                styles.dropdownItem,
                i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
              ]}
            >
              <View style={[styles.dropdownIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name={it.icon as any} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.dropdownLabel, { color: colors.foreground }]}>{it.label}</Text>
              <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ============================================================
// HOME
// ============================================================
function HomeScreen({ colors, onOpenLearn, onOpenPlay, overallPct, quizScores, campaignScores }: any) {
  const quizCount = Object.values(quizScores || {}).reduce(
    (n: number, track: any) => n + Object.keys(track || {}).length, 0
  );
  const campaignCount = Object.keys(campaignScores || {}).length;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>NEXT STEPS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Let's get adulting</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Real decisions, real consequences, one uncomfortable truth at a time.
      </Text>

      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroLabel}>YOUR PROGRESS</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 12, alignItems: "center" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.heroNum}>{quizCount}</Text>
            <Text style={styles.heroSubLabel}>Lessons done</Text>
          </View>
          <View style={styles.heroDiv} />
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.heroNum, { fontSize: 40 }]}>{overallPct}%</Text>
            <Text style={styles.heroSubLabel}>Overall</Text>
          </View>
          <View style={styles.heroDiv} />
          <View style={{ alignItems: "center" }}>
            <Text style={styles.heroNum}>{campaignCount}</Text>
            <Text style={styles.heroSubLabel}>Scenarios played</Text>
          </View>
        </View>
        <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 6, marginTop: 14, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${overallPct}%`, backgroundColor: "white" }} />
        </View>
      </View>

      <SectionHeader colors={colors} title="Jump in" />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onOpenPlay}>
          <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft }]}>
            <Feather name="play" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.quickLabel, { color: colors.foreground }]}>Play Scenarios</Text>
        </Pressable>
        <Pressable style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onOpenLearn}>
          <View style={[styles.quickIcon, { backgroundColor: colors.secondarySoft }]}>
            <Feather name="book-open" size={22} color={colors.secondary} />
          </View>
          <Text style={[styles.quickLabel, { color: colors.foreground }]}>Review Lessons</Text>
        </Pressable>
      </View>

      <SectionHeader colors={colors} title="Skill Tracks" />
      {SCENARIOS.map(sc => (
        <ScenarioTrackCard key={sc.id} colors={colors} scenario={sc} onPress={onOpenPlay} />
      ))}
    </ScrollView>
  );
}

function SectionHeader({ colors, title, right }: any) {
  return (
    <View style={{ marginTop: 22, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {right}
    </View>
  );
}

function ScenarioTrackCard({ colors, scenario, onPress }: { colors: Palette; scenario: Scenario; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.trackAccent, { backgroundColor: scenario.accent }]} />
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={[styles.trackTitle, { color: colors.foreground }]}>{scenario.name}</Text>
        <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>{scenario.who.toUpperCase()}</Text>
        <Text style={[styles.trackDesc, { color: colors.mutedForeground, marginTop: 6 }]} numberOfLines={2}>{scenario.desc}</Text>
      </View>
      <View style={{ padding: 16, justifyContent: "center" }}>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

// ============================================================
// LEARN
// ============================================================
function LearnScreen({ colors, onPick, quizScores }: any) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.secondary }]}>LESSONS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Study, then play</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Short readings and quizzes for each scenario. Every quiz is scored out of 100 — your best score counts toward overall progress.
      </Text>
      {SCENARIOS.map(sc => {
        const pack = EDUCATION[sc.id];
        const quizzes = pack?.quizzes || [];
        const scored = quizScores?.[sc.id] || {};
        const done = Object.keys(scored).length;
        const avg = done > 0 ? Math.round(Object.values(scored as Record<string, number>).reduce((a, b) => a + b, 0) / done) : 0;
        return (
          <Pressable key={sc.id} onPress={() => onPick(sc.id)} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.trackAccent, { backgroundColor: sc.accent }]} />
            <View style={{ flex: 1, padding: 16 }}>
              <Text style={[styles.trackTitle, { color: colors.foreground }]}>{sc.name}</Text>
              <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>
                {quizzes.length} LESSONS · {done}/{quizzes.length} DONE{done > 0 ? ` · AVG ${avg}%` : ""}
              </Text>
              <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 6, marginTop: 8, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${quizzes.length ? (done / quizzes.length) * 100 : 0}%`, backgroundColor: sc.accent }} />
              </View>
            </View>
            <View style={{ padding: 16, justifyContent: "center" }}>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function LearnDetailScreen({ colors, scenarioId, onBack, quizScores, onOpenQuiz }: any) {
  const sc = SCENARIO_MAP[scenarioId];
  const pack = EDUCATION[scenarioId];
  if (!sc || !pack) return null;
  const scored = quizScores?.[scenarioId] || {};
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Feather name="chevron-left" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Back</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: sc.accent }]}>{sc.name.toUpperCase()}</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Lessons & quizzes</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Each lesson has a short reading and a quiz. Your best score counts toward overall progress.
      </Text>

      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground, marginTop: 0 }]}>INTERACTIVE LESSONS ({pack.quizzes.length})</Text>
      {pack.quizzes.map((q: Lesson) => {
        const score = scored[q.id];
        const done = typeof score === "number";
        return (
          <Pressable key={q.id} onPress={() => onOpenQuiz(scenarioId, q.id)} style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: sc.accent }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.lessonT, { color: colors.foreground }]}>{q.title}</Text>
                <Text style={[styles.lessonD, { color: colors.mutedForeground }]}>{q.summary}</Text>
                <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, marginTop: 6 }}>
                  {q.questions.length} QUESTIONS
                </Text>
              </View>
              <View style={{ alignItems: "center", minWidth: 56 }}>
                {done ? (
                  <>
                    <Text style={{ color: score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.destructive, fontFamily: "Inter_800ExtraBold", fontSize: 22 }}>{score}</Text>
                    <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground }}>BEST</Text>
                  </>
                ) : (
                  <Feather name="play-circle" size={28} color={sc.accent} />
                )}
              </View>
            </View>
          </Pressable>
        );
      })}

      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>KEY TAKEAWAYS</Text>
      {pack.lessons.map((l, i) => (
        <View key={i} style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: sc.accent }]}>
          <Text style={[styles.lessonT, { color: colors.foreground }]}>{l.t}</Text>
          <Text style={[styles.lessonD, { color: colors.mutedForeground }]}>{l.d}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ============================================================
// PLAY (with Campaign / Freeplay / Level Design sub-tabs)
// ============================================================
function PlayScreen({ colors, levels, onCampaign, onCustomPlay, onOpenLevelDesign }: any) {
  const [mode, setMode] = useState<"campaign" | "design">("campaign");

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>LIFE SIM</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Pick your mode</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 16 }]}>
        Make choices. Face consequences. Try to survive.
      </Text>

      <View style={[styles.segmented, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SegmentedItem colors={colors} active={mode === "campaign"} label="Campaign" onPress={() => setMode("campaign")} />
        <SegmentedItem colors={colors} active={mode === "design"} label="Level Design" onPress={() => setMode("design")} />
      </View>

      {mode === "campaign" && (
        <>
          <Text style={[styles.modeHint, { color: colors.mutedForeground }]}>
            Preset scenarios. Pick one, then choose whether to play as the default character or one of your saved ones.
          </Text>
          {SCENARIOS.map((sc) => (
            <ScenarioPlayCard key={sc.id} colors={colors} scenario={sc} onPress={() => onCampaign(sc.id)} />
          ))}
        </>
      )}

      {mode === "design" && (
        <>
          <Text style={[styles.modeHint, { color: colors.mutedForeground }]}>
            Build your own scenarios with the same engine that runs the campaigns. Your saved characters work on them too.
          </Text>
          <Pressable
            style={[styles.bigCta, { backgroundColor: colors.primary }]}
            onPress={onOpenLevelDesign}
          >
            <Feather name="edit-3" size={20} color="white" />
            <Text style={styles.bigCtaText}>Open Level Editor</Text>
          </Pressable>
          {levels.length === 0 ? (
            <Text style={[styles.modeHint, { color: colors.mutedForeground, marginTop: 14 }]}>
              No custom levels yet. Tap the button above to create one.
            </Text>
          ) : (
            levels.map((lvl: CustomLevel) => (
              <View key={lvl.id} style={[styles.customCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.trackTitle, { color: colors.foreground }]}>{lvl.name}</Text>
                <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>{lvl.who}</Text>
                <Text style={[styles.trackDesc, { color: colors.mutedForeground, marginTop: 6 }]} numberOfLines={2}>{lvl.desc}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <SmallBtn colors={colors} kind="primary" label="▶ Play" onPress={() => onCustomPlay(lvl)} />
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function SegmentedItem({ colors, active, label, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={[styles.segItem, active && { backgroundColor: colors.primary }]}>
      <Text style={{ color: active ? "white" : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function ScenarioPlayCard({ colors, scenario, onPress }: { colors: Palette; scenario: Scenario; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.trackAccent, { backgroundColor: scenario.accent }]} />
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.trackTitle, { color: colors.foreground }]}>{scenario.name}</Text>
            <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>{scenario.who.toUpperCase()}</Text>
          </View>
          <View style={[styles.playBadge, { backgroundColor: scenario.accent + "22" }]}>
            <Feather name="play" size={14} color={scenario.accent} />
          </View>
        </View>
        <Text style={[styles.trackDesc, { color: colors.mutedForeground, marginTop: 8 }]} numberOfLines={2}>{scenario.desc}</Text>
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>{scenario.estimatedTime}</Text>
          <Text style={{ color: scenario.accent, fontFamily: "Inter_700Bold", fontSize: 13 }}>Play now</Text>
        </View>
      </View>
    </Pressable>
  );
}

function SmallBtn({ colors, kind, label, onPress }: any) {
  const bg = kind === "primary" ? colors.primary : kind === "secondary" ? colors.secondary : colors.muted;
  const fg = kind === "muted" ? colors.foreground : "white";
  return (
    <Pressable onPress={onPress} style={[styles.smallBtn, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontFamily: "Inter_700Bold", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

// ============================================================
// CHARACTER SELECT (Freeplay modifiers)
// ============================================================
// ============================================================
// GAME
// ============================================================
function GameScreen({ colors, state, scenario, feedback, onPick, onBack }: any) {
  const scene = scenario.scenes[state.currentSceneId];
  if (!scene) return null;
  const choices = scene.choices || [];
  const order = useMemo(() => shufflePickOrder(choices), [state.currentSceneId]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center" }}>
          <Feather name="chevron-left" size={20} color={colors.primary} />
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Menu</Text>
        </Pressable>
        <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>{state.charName}</Text>
      </View>

      <StatsBar colors={colors} state={state} />
      <LawMeter colors={colors} law={state.law} />

      {feedback && <FeedbackBanner colors={colors} feedback={feedback} />}

      <View style={[styles.sceneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sceneTitle, { color: colors.primary }]}>{scene.title}</Text>
        <Text style={[styles.sceneText, { color: colors.foreground }]}>{typeof scene.text === "function" ? scene.text(state) : scene.text}</Text>
      </View>

      {order.map((origIdx, displayIdx) => {
        const c = choices[origIdx];
        return (
          <Pressable key={displayIdx} onPress={() => onPick(c)} style={[styles.choiceBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.choiceLetter, { color: colors.primary }]}>[{"ABCDEFGH"[displayIdx]}]</Text>
            <Text style={[styles.choiceLabel, { color: colors.foreground }]}>{typeof c.label === "function" ? c.label(state) : c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function StatsBar({ colors, state }: any) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
      <StatCell colors={colors} label="Health" value={state.health} color={colors.health} max={100} />
      <StatCell colors={colors} label="Wellbeing" value={state.wellbeing} color={colors.wellbeing} max={100} />
      <StatCell colors={colors} label="Cash" value={`$${Math.round(state.money).toLocaleString()}`} color={colors.success} />
    </View>
  );
}

function StatCell({ colors, label, value, color, max }: any) {
  const pct = typeof value === "number" && max ? Math.min(100, (value / max) * 100) : null;
  return (
    <View style={[styles.statCell, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{typeof value === "number" ? Math.round(value) : value}{max ? `/${max}` : ""}</Text>
      {pct != null && (
        <View style={[styles.statBarBg, { backgroundColor: colors.muted }]}>
          <View style={[styles.statBarFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      )}
    </View>
  );
}

function LawMeter({ colors, law }: any) {
  const hot = law >= 60;
  return (
    <View style={[styles.lawCard, { backgroundColor: colors.card, borderColor: hot ? colors.destructive : colors.border }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>⚖ LAW HEAT</Text>
        <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold" }}>{Math.round(law)}%</Text>
      </View>
      <View style={[styles.statBarBg, { backgroundColor: colors.muted, marginTop: 6 }]}>
        <View style={[styles.statBarFill, { width: `${Math.min(100, law)}%`, backgroundColor: colors.law }]} />
      </View>
    </View>
  );
}

function FeedbackBanner({ colors, feedback }: any) {
  const bg = feedback.kind === "good" ? colors.successSoft : feedback.kind === "bad" ? colors.destructiveSoft : colors.warningSoft;
  const fg = feedback.kind === "good" ? colors.success : feedback.kind === "bad" ? colors.destructive : colors.warning;
  const label = feedback.kind === "good" ? "✓ GOOD CALL" : feedback.kind === "bad" ? "✗ BAD CALL" : "~ MIXED BAG";
  const d = feedback.delta || {};
  const parts: string[] = [];
  if (d.money) parts.push(`${d.money >= 0 ? "+" : ""}$${Math.round(d.money)}`);
  if (d.health) parts.push(`${d.health >= 0 ? "+" : ""}${Math.round(d.health)} Health`);
  if (d.wellbeing) parts.push(`${d.wellbeing >= 0 ? "+" : ""}${Math.round(d.wellbeing)} Wellbeing`);
  if (d.law) parts.push(`${d.law >= 0 ? "+" : ""}${Math.round(d.law)} Law`);
  return (
    <View style={[styles.feedback, { backgroundColor: bg, borderColor: fg }]}>
      <Text style={{ color: fg, fontFamily: "Inter_800ExtraBold", fontSize: 11, letterSpacing: 1.2 }}>{label}</Text>
      <Text style={{ color: fg, fontSize: 14, marginTop: 4, lineHeight: 20 }}>{feedback.text}</Text>
      {parts.length > 0 && (
        <Text style={{ color: fg, fontFamily: "Inter_700Bold", fontSize: 12, marginTop: 6 }}>{parts.join(" · ")}</Text>
      )}
    </View>
  );
}

// ============================================================
// OUTCOME
// ============================================================
function OutcomeScreen({ colors, state, scenario, eduPack, onHome, onPlay, finalScore }: any) {
  const endingId = state.currentSceneId;
  const ending = scenario.scenes[endingId];
  const kind = (ending as any)?.endingKind || (ending as any)?.kind || "mid";
  const fg = kind === "good" ? colors.success : kind === "bad" ? colors.destructive : colors.warning;
  const reasons = eduPack?.analyze ? eduPack.analyze(state) : [];
  const lessons = eduPack?.lessons || [];
  const endingText = typeof ending?.text === "function" ? ending.text(state) : ending?.text || "";

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <View style={[styles.endingCard, { backgroundColor: colors.card, borderColor: fg }]}>
        <Text style={[styles.endingTitle, { color: fg }]}>{ending?.title || "Game Over"}</Text>
        {typeof finalScore === "number" && (
          <View style={{ alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontFamily: "Inter_800ExtraBold", letterSpacing: 1.4, color: colors.mutedForeground }}>SCORE</Text>
            <Text style={{ fontSize: 48, fontFamily: "Inter_800ExtraBold", color: fg }}>{finalScore}</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>out of 100 · counts toward your overall progress</Text>
          </View>
        )}
        <Text style={[styles.endingBody, { color: colors.foreground }]}>{endingText}</Text>
        <Text style={[styles.endingMeta, { color: colors.mutedForeground }]}>
          Health: {Math.round(state.health)} · Wellbeing: {Math.round(state.wellbeing)} · Cash: ${Math.round(state.money).toLocaleString()} · Law: {Math.round(state.law)}%
        </Text>
      </View>

      {reasons.length > 0 && (
        <>
          <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>WHY YOU GOT THIS ENDING</Text>
          {reasons.map((r: any, i: number) => {
            const bg = r.kind === "good" ? colors.successSoft : r.kind === "bad" ? colors.destructiveSoft : colors.warningSoft;
            const rfg = r.kind === "good" ? colors.success : r.kind === "bad" ? colors.destructive : colors.warning;
            return (
              <View key={i} style={[styles.reason, { backgroundColor: bg, borderColor: rfg }]}>
                <Text style={{ color: rfg, fontFamily: "Inter_800ExtraBold", marginRight: 8 }}>
                  {r.kind === "good" ? "✓" : r.kind === "bad" ? "✗" : "~"}
                </Text>
                <Text style={{ color: rfg, flex: 1, fontSize: 14, lineHeight: 20 }}>{r.text}</Text>
              </View>
            );
          })}
        </>
      )}

      {lessons.length > 0 && (
        <>
          <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>💡 KEY TAKEAWAYS</Text>
          {lessons.map((l: any, i: number) => (
            <View key={i} style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary }]}>
              <Text style={[styles.lessonT, { color: colors.foreground }]}>{l.t}</Text>
              <Text style={[styles.lessonD, { color: colors.mutedForeground }]}>{l.d}</Text>
            </View>
          ))}
        </>
      )}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        <Pressable style={[styles.bigCta, { backgroundColor: colors.primary, flex: 1 }]} onPress={onPlay}>
          <Feather name="play" size={18} color="white" />
          <Text style={styles.bigCtaText}>Play again</Text>
        </Pressable>
        <Pressable style={[styles.bigCta, { backgroundColor: colors.muted, flex: 1 }]} onPress={onHome}>
          <Text style={[styles.bigCtaText, { color: colors.foreground }]}>Home</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ============================================================
// TOOLS, PROGRESS, SETTINGS, CHARACTERS
// ============================================================
function ToolsScreen({ colors, onOpenBudget, onOpenLease, onOpenTaxDocs }: any) {
  const tools = [
    { icon: "sliders", label: "Budget Builder", color: colors.primary, note: "Plan income, expenses, and savings with the 50/30/20 rule.", onPress: onOpenBudget },
    { icon: "check-square", label: "Lease Checklist", color: colors.wellbeing, note: "20 items to verify before signing — grouped by showing, lease, and move-in.", onPress: onOpenLease },
    { icon: "file-text", label: "Tax Doc Tracker", color: colors.secondary, note: "W-2s, 1099s, 1098s — check off what you've received, sorted by deadline.", onPress: onOpenTaxDocs },
  ];
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>TOOLS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Practical helpers</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Working calculators and checklists. Your progress saves to your device.
      </Text>
      {tools.map(t => (
        <Pressable key={t.label} onPress={t.onPress} style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.toolIcon, { backgroundColor: t.color + "22" }]}>
            <Feather name={t.icon as any} size={22} color={t.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.trackTitle, { color: colors.foreground }]}>{t.label}</Text>
            <Text style={[styles.trackDesc, { color: colors.mutedForeground, marginTop: 2 }]}>{t.note}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ============================================================
// TOOL: BUDGET BUILDER
// ============================================================
function BudgetBuilderScreen({ colors, onBack }: any) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [addingCategory, setAddingCategory] = useState<BudgetCategory | null>(null);

  useEffect(() => {
    loadBudget().then(b => {
      if (b.items.length === 0 && b.income === 0) {
        // First load — seed starter categories.
        const starter: Budget = { ...b, items: BUDGET_STARTER_ITEMS.map(s => ({ id: newBudgetItemId(), ...s })) };
        saveBudget(starter);
        setBudget(starter);
      } else {
        setBudget(b);
      }
    });
  }, []);

  if (!budget) return <View />;

  const updateIncome = (v: string) => {
    const income = parseInt(v) || 0;
    const next = { ...budget, income };
    setBudget(next); saveBudget(next);
  };
  const updateItem = (id: string, patch: Partial<BudgetItem>) => {
    const items = budget.items.map(it => it.id === id ? { ...it, ...patch } : it);
    const next = { ...budget, items };
    setBudget(next); saveBudget(next);
  };
  const deleteItem = (id: string) => {
    const next = { ...budget, items: budget.items.filter(it => it.id !== id) };
    setBudget(next); saveBudget(next);
  };
  const addItem = (category: BudgetCategory) => {
    const item: BudgetItem = { id: newBudgetItemId(), label: "New expense", category, amount: 0 };
    const next = { ...budget, items: [...budget.items, item] };
    setBudget(next); saveBudget(next);
    setAddingCategory(null);
  };

  const totalByCategory = (cat: BudgetCategory) =>
    budget.items.filter(i => i.category === cat).reduce((n, i) => n + (i.amount || 0), 0);

  const needsTotal = totalByCategory("needs");
  const wantsTotal = totalByCategory("wants");
  const savingsTotal = totalByCategory("savings");
  const expensesTotal = needsTotal + wantsTotal + savingsTotal;
  const leftover = budget.income - expensesTotal;
  const pct = (n: number) => budget.income > 0 ? Math.round((n / budget.income) * 100) : 0;

  // 50/30/20 targets
  const target = { needs: 50, wants: 30, savings: 20 };
  const actual = { needs: pct(needsTotal), wants: pct(wantsTotal), savings: pct(savingsTotal) };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Feather name="chevron-left" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Tools</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>BUDGET BUILDER</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Where does it go?</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 16 }]}>
        Track monthly take-home income against Needs, Wants, and Savings. Saves automatically.
      </Text>

      <View style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: "column", alignItems: "stretch" }]}>
        <Text style={[styles.edLabel, { color: colors.mutedForeground }]}>MONTHLY TAKE-HOME ($)</Text>
        <TextInput
          value={String(budget.income || "")}
          onChangeText={updateIncome}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          style={{
            backgroundColor: colors.muted, color: colors.foreground,
            borderWidth: 1, borderColor: colors.border, borderRadius: 10,
            padding: 12, fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 6,
          }}
        />
      </View>

      <View style={[styles.heroCard, { backgroundColor: colors.primary, marginTop: 14 }]}>
        <Text style={styles.heroLabel}>50 / 30 / 20 RULE</Text>
        <Text style={{ color: "white", fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2, opacity: 0.9 }}>
          Target: 50% Needs · 30% Wants · 20% Savings
        </Text>
        <View style={{ marginTop: 14, gap: 10 }}>
          {([
            { key: "needs" as const, label: "Needs", val: actual.needs, total: needsTotal, tgt: target.needs },
            { key: "wants" as const, label: "Wants", val: actual.wants, total: wantsTotal, tgt: target.wants },
            { key: "savings" as const, label: "Savings", val: actual.savings, total: savingsTotal, tgt: target.savings },
          ]).map(row => (
            <View key={row.key}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ color: "white", fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                  {row.label} — ${Math.round(row.total).toLocaleString()} ({row.val}%)
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium", fontSize: 12 }}>target {row.tgt}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 8, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${Math.min(100, row.val)}%`, backgroundColor: "white" }} />
              </View>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "white", fontFamily: "Inter_700Bold" }}>
            {leftover >= 0 ? "Unallocated" : "Over budget"}
          </Text>
          <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: 18 }}>
            {leftover >= 0 ? "+" : ""}${Math.round(leftover).toLocaleString()}
          </Text>
        </View>
      </View>

      {(["needs", "wants", "savings"] as BudgetCategory[]).map(cat => {
        const items = budget.items.filter(i => i.category === cat);
        const accent = cat === "needs" ? colors.destructive : cat === "wants" ? colors.warning : colors.success;
        return (
          <View key={cat} style={{ marginTop: 18 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, textTransform: "capitalize" }]}>{cat}</Text>
              <SmallBtn colors={colors} kind="muted" label="+ Add" onPress={() => addItem(cat)} />
            </View>
            {items.length === 0 && (
              <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular" }}>None yet.</Text>
            )}
            {items.map(item => (
              <View key={item.id} style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: accent }]}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={item.label}
                    onChangeText={v => updateItem(item.id, { label: v })}
                    style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15, padding: 0 }}
                  />
                </View>
                <TextInput
                  value={String(item.amount || "")}
                  onChangeText={v => updateItem(item.id, { amount: parseInt(v) || 0 })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  style={{
                    color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16,
                    backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                    minWidth: 80, textAlign: "right",
                  }}
                />
                <Pressable onPress={() => deleteItem(item.id)} hitSlop={8} style={{ marginLeft: 8 }}>
                  <Feather name="x" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ============================================================
// TOOL: LEASE CHECKLIST
// ============================================================
function LeaseChecklistScreen({ colors, onBack }: any) {
  const [state, setState] = useState<Record<string, { checked: boolean; note: string }>>({});
  useEffect(() => { loadChecklist().then(setState); }, []);

  const toggle = (id: string) => {
    const next = { ...state, [id]: { checked: !state[id]?.checked, note: state[id]?.note || "" } };
    setState(next); saveChecklist(next);
  };
  const updateNote = (id: string, note: string) => {
    const next = { ...state, [id]: { checked: state[id]?.checked || false, note } };
    setState(next); saveChecklist(next);
  };

  const total = LEASE_CHECKLIST.reduce((n, s) => n + s.items.length, 0);
  const done = Object.values(state).filter(v => v.checked).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Feather name="chevron-left" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Tools</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: colors.wellbeing }]}>LEASE CHECKLIST</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Before you sign</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 14 }]}>
        {done} of {total} verified ({pct}%). Each item has a note field for what you saw.
      </Text>
      <View style={{ height: 8, backgroundColor: colors.muted, borderRadius: 8, marginBottom: 18, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${pct}%`, backgroundColor: colors.wellbeing }} />
      </View>

      {LEASE_CHECKLIST.map(section => (
        <View key={section.title} style={{ marginBottom: 18 }}>
          <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground, marginTop: 0, marginBottom: 8 }]}>{section.title.toUpperCase()}</Text>
          {section.items.map(item => {
            const s = state[item.id] || { checked: false, note: "" };
            return (
              <View key={item.id} style={[styles.toolCard, { backgroundColor: colors.card, borderColor: s.checked ? colors.success : colors.border, flexDirection: "column", alignItems: "stretch" }]}>
                <Pressable onPress={() => toggle(item.id)} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 6,
                    borderWidth: 2, borderColor: s.checked ? colors.success : colors.border,
                    backgroundColor: s.checked ? colors.success : "transparent",
                    alignItems: "center", justifyContent: "center", marginTop: 1,
                  }}>
                    {s.checked && <Feather name="check" size={14} color="white" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14, textDecorationLine: s.checked ? "line-through" : "none" }}>
                      {item.label}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 3, lineHeight: 18, fontFamily: "Inter_400Regular" }}>
                      {item.note}
                    </Text>
                  </View>
                </Pressable>
                <TextInput
                  value={s.note}
                  onChangeText={v => updateNote(item.id, v)}
                  placeholder="Your notes (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={{
                    backgroundColor: colors.muted, color: colors.foreground,
                    borderRadius: 8, padding: 10, marginTop: 10, fontSize: 13,
                    fontFamily: "Inter_400Regular", minHeight: 40,
                    textAlignVertical: "top",
                  }}
                />
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

// ============================================================
// TOOL: TAX DOC TRACKER
// ============================================================
function TaxTrackerScreen({ colors, onBack }: any) {
  const [state, setState] = useState<TaxDocState>({});
  useEffect(() => { loadTaxDocs().then(setState); }, []);

  const toggle = (id: string) => {
    const next = { ...state, [id]: { received: !state[id]?.received, notes: state[id]?.notes || "" } };
    setState(next); saveTaxDocs(next);
  };
  const updateNotes = (id: string, notes: string) => {
    const next = { ...state, [id]: { received: state[id]?.received || false, notes } };
    setState(next); saveTaxDocs(next);
  };

  const total = TAX_DOCS.length;
  const received = TAX_DOCS.filter(d => state[d.id]?.received).length;

  // Group by deadline
  const grouped: Record<string, typeof TAX_DOCS> = {};
  TAX_DOCS.slice().sort((a, b) => a.deadlineSortKey - b.deadlineSortKey).forEach(d => {
    (grouped[d.deadline] = grouped[d.deadline] || []).push(d);
  });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Feather name="chevron-left" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Tools</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: colors.secondary }]}>TAX DOC TRACKER</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>What's in the mailbox</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 14 }]}>
        Check off each document as you receive it. {received} of {total} received. Grouped by issuer deadline.
      </Text>

      <View style={[styles.heroCard, { backgroundColor: colors.secondary, marginBottom: 16 }]}>
        <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: 11, letterSpacing: 1.4 }}>FILING DEADLINE</Text>
        <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: 24, marginTop: 4 }}>April 15</Text>
        <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 4, fontFamily: "Inter_500Medium" }}>
          File on time even if you can't pay — failure-to-file is 5%/mo, 10× the failure-to-pay penalty.
        </Text>
      </View>

      {Object.entries(grouped).map(([deadline, docs]) => (
        <View key={deadline} style={{ marginBottom: 18 }}>
          <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground, marginTop: 0, marginBottom: 8 }]}>
            EXPECTED BY {deadline.toUpperCase()}
          </Text>
          {docs.map(doc => {
            const s = state[doc.id] || { received: false, notes: "" };
            return (
              <View key={doc.id} style={[styles.toolCard, { backgroundColor: colors.card, borderColor: s.received ? colors.success : colors.border, flexDirection: "column", alignItems: "stretch" }]}>
                <Pressable onPress={() => toggle(doc.id)} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 6,
                    borderWidth: 2, borderColor: s.received ? colors.success : colors.border,
                    backgroundColor: s.received ? colors.success : "transparent",
                    alignItems: "center", justifyContent: "center", marginTop: 1,
                  }}>
                    {s.received && <Feather name="check" size={14} color="white" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: colors.foreground, fontFamily: "Inter_800ExtraBold", fontSize: 14 }}>{doc.name}</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 }}>
                        {doc.fullName}
                      </Text>
                    </View>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 2 }}>
                      From: {doc.who}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4, lineHeight: 18, fontFamily: "Inter_400Regular" }}>
                      {doc.description}
                    </Text>
                  </View>
                </Pressable>
                <TextInput
                  value={s.notes}
                  onChangeText={v => updateNotes(doc.id, v)}
                  placeholder="Notes (amount, source, where it's filed...)"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  style={{
                    backgroundColor: colors.muted, color: colors.foreground,
                    borderRadius: 8, padding: 10, marginTop: 10, fontSize: 13,
                    fontFamily: "Inter_400Regular", minHeight: 36,
                    textAlignVertical: "top",
                  }}
                />
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function ProgressScreen({ colors, quizScores, campaignScores, levels, characters, overallPct }: any) {
  const allTracks = Object.entries(EDUCATION);
  const totalQuizzes = allTracks.reduce((n, [, p]) => n + p.quizzes.length, 0);
  const completedQuizzes = Object.values(quizScores || {}).reduce((n: number, track: any) => n + Object.keys(track || {}).length, 0);
  const totalCampaigns = SCENARIOS.length + (levels?.length || 0);
  const playedCampaigns = Object.keys(campaignScores || {}).length;

  const scoreColor = (s: number) => s >= 80 ? colors.success : s >= 60 ? colors.warning : colors.destructive;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>PROGRESS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Your runs</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 16 }]}>
        Every lesson and scenario score persists to your device.
      </Text>

      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroLabel}>OVERALL COMPLETION</Text>
        <Text style={{ color: "white", fontSize: 44, fontFamily: "Inter_800ExtraBold", textAlign: "center", marginTop: 4 }}>{overallPct}%</Text>
        <View style={{ height: 8, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, marginTop: 10, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${overallPct}%`, backgroundColor: "white" }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 14 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: 20 }}>{completedQuizzes}/{totalQuizzes}</Text>
            <Text style={styles.heroSubLabel}>Quizzes</Text>
          </View>
          <View style={styles.heroDiv} />
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: 20 }}>{playedCampaigns}/{totalCampaigns}</Text>
            <Text style={styles.heroSubLabel}>Scenarios</Text>
          </View>
          <View style={styles.heroDiv} />
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "white", fontFamily: "Inter_800ExtraBold", fontSize: 20 }}>{characters?.length || 0}</Text>
            <Text style={styles.heroSubLabel}>Characters</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>CAMPAIGN RUNS</Text>
      {SCENARIOS.map(sc => {
        const data = campaignScores?.[sc.id];
        return (
          <View key={sc.id} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.trackAccent, { backgroundColor: sc.accent }]} />
            <View style={{ flex: 1, padding: 16 }}>
              <Text style={[styles.trackTitle, { color: colors.foreground }]}>{sc.name}</Text>
              <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>
                {data ? `${data.plays} PLAY${data.plays === 1 ? "" : "S"} · LAST: ${data.lastScore}` : "NOT YET PLAYED"}
              </Text>
            </View>
            <View style={{ padding: 16, alignItems: "center", minWidth: 60 }}>
              {data ? (
                <>
                  <Text style={{ color: scoreColor(data.best), fontFamily: "Inter_800ExtraBold", fontSize: 22 }}>{data.best}</Text>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_700Bold" }}>BEST</Text>
                </>
              ) : (
                <Feather name="circle" size={22} color={colors.mutedForeground} />
              )}
            </View>
          </View>
        );
      })}

      {levels && levels.length > 0 && (
        <>
          <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>YOUR CUSTOM LEVELS</Text>
          {levels.map((lvl: CustomLevel) => {
            const data = campaignScores?.[lvl.id];
            return (
              <View key={lvl.id} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.trackAccent, { backgroundColor: colors.primary }]} />
                <View style={{ flex: 1, padding: 16 }}>
                  <Text style={[styles.trackTitle, { color: colors.foreground }]}>{lvl.name}</Text>
                  <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>
                    {data ? `${data.plays} PLAY${data.plays === 1 ? "" : "S"}` : "NOT YET PLAYED"}
                  </Text>
                </View>
                <View style={{ padding: 16, alignItems: "center", minWidth: 60 }}>
                  {data ? (
                    <>
                      <Text style={{ color: scoreColor(data.best), fontFamily: "Inter_800ExtraBold", fontSize: 22 }}>{data.best}</Text>
                      <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_700Bold" }}>BEST</Text>
                    </>
                  ) : (
                    <Feather name="circle" size={22} color={colors.mutedForeground} />
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}

      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>LESSON TRACKS</Text>
      {allTracks.map(([trackId, pack]) => {
        const sc = SCENARIO_MAP[trackId];
        const scored = quizScores?.[trackId] || {};
        const done = Object.keys(scored).length;
        const scores = Object.values(scored as Record<string, number>);
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return (
          <View key={trackId} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: "column" }]}>
            <View style={{ flexDirection: "row" }}>
              <View style={[styles.trackAccent, { backgroundColor: sc?.accent || colors.primary }]} />
              <View style={{ flex: 1, padding: 16 }}>
                <Text style={[styles.trackTitle, { color: colors.foreground }]}>{sc?.name || trackId}</Text>
                <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>
                  {done}/{pack.quizzes.length} QUIZZES · AVG {avg}
                </Text>
                <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 6, marginTop: 8, overflow: "hidden" }}>
                  <View style={{ height: "100%", width: `${pack.quizzes.length ? (done / pack.quizzes.length) * 100 : 0}%`, backgroundColor: sc?.accent || colors.primary }} />
                </View>
              </View>
            </View>
            {done > 0 && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 4 }}>
                {pack.quizzes.filter(q => scored[q.id] !== undefined).map(q => (
                  <View key={q.id} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 }} numberOfLines={1}>{q.title}</Text>
                    <Text style={{ color: scoreColor(scored[q.id]), fontFamily: "Inter_800ExtraBold", fontSize: 14 }}>{scored[q.id]}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function SettingsScreen({ colors, theme, onDataChanged, onAfterReset, profile, onEditProfile }: any) {
  const opts: { val: ThemeMode; label: string; icon: string }[] = [
    { val: "light", label: "Light", icon: "sun" },
    { val: "dark", label: "Dark", icon: "moon" },
    { val: "system", label: "Match System", icon: "monitor" },
  ];
  const [showExport, setShowExport] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const runExport = async () => {
    const data = await exportAllData();
    setShowExport(JSON.stringify(data, null, 2));
  };
  const runImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      await importAllData(parsed);
      setShowImport(false);
      setImportText("");
      onDataChanged?.();
    } catch (e: any) {
      Alert.alert("Import failed", "The JSON is invalid. " + (e?.message || ""));
    }
  };
  const runReset = async () => {
    await resetEverything();
    setConfirmReset(false);
    // Prefer onAfterReset (wipes state + sends user to profile-create). Fall back to refresh.
    if (onAfterReset) await onAfterReset();
    else onDataChanged?.();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>SETTINGS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Preferences</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>Profile, theme, data, about.</Text>

      {/* PROFILE */}
      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground, marginTop: 0 }]}>PROFILE</Text>
      <Pressable
        onPress={onEditProfile}
        style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14 }]}
      >
        <AvatarDisplay
          colors={colors}
          avatarId={profile?.avatarId}
          avatarUri={profile?.avatarUri}
          name={profile?.username}
          size={52}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.setupLabel, { color: colors.foreground, marginBottom: 2 }]}>
            {profile?.username || "No profile"}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
            Tap to change username or picture
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>

      {/* APPEARANCE */}
      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground, marginTop: 0 }]}>APPEARANCE</Text>
      <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setupLabel, { color: colors.foreground }]}>Theme</Text>
        <Text style={[styles.setupQ, { color: colors.mutedForeground }]}>Choose your display mode.</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {opts.map(o => {
            const active = theme.mode === o.val;
            return (
              <Pressable key={o.val} onPress={() => theme.setThemeMode(o.val)} style={[styles.themeBtn, {
                backgroundColor: active ? colors.primary : colors.muted,
                borderColor: active ? colors.primary : colors.border,
              }]}>
                <Feather name={o.icon as any} size={16} color={active ? "white" : colors.foreground} />
                <Text style={{ color: active ? "white" : colors.foreground, fontFamily: "Inter_600SemiBold", marginLeft: 8 }}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* DATA & PRIVACY */}
      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>DATA & PRIVACY</Text>
      <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setupLabel, { color: colors.foreground }]}>Local storage only</Text>
        <Text style={[styles.setupQ, { color: colors.mutedForeground }]}>
          Every score, character, and custom level lives on this device. Nothing is sent to a server.
        </Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <SmallBtn colors={colors} kind="secondary" label="⬇ Export data" onPress={runExport} />
          <SmallBtn colors={colors} kind="secondary" label="⬆ Import data" onPress={() => setShowImport(true)} />
          <SmallBtn colors={colors} kind="muted" label="⚠ Reset all" onPress={() => setConfirmReset(true)} />
        </View>
      </View>

      {/* ABOUT */}
      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>ABOUT</Text>
      <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setupLabel, { color: colors.foreground }]}>Next Step</Text>
        <Text style={[styles.setupQ, { color: colors.mutedForeground }]}>
          Version 1.0.0
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 4, fontFamily: "Inter_400Regular" }}>
          Life-skills education via branching scenarios. Built for young adults navigating taxes, rentals, employment, car buying, and healthcare without a manual.
        </Text>
      </View>
      <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setupLabel, { color: colors.foreground }]}>Disclaimer</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" }}>
          Educational content only. Laws vary by state and change over time. Consult a qualified professional (CPA, attorney, tenant legal aid) for advice on your specific situation.
        </Text>
      </View>

      {/* EXPORT MODAL */}
      <Modal visible={showExport !== null} transparent animationType="slide" onRequestClose={() => setShowExport(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ flex: 1, backgroundColor: colors.background, marginTop: 80, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={[styles.h1, { color: colors.foreground, fontSize: 22 }]}>Export Data</Text>
              <Pressable onPress={() => setShowExport(null)}>
                <Feather name="x" size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 10, fontFamily: "Inter_400Regular" }}>
              Copy this JSON to back up or transfer your progress to another device.
            </Text>
            <ScrollView style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 10, padding: 12 }}>
              <Text selectable style={{ color: colors.foreground, fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
                {showExport}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* IMPORT MODAL */}
      <Modal visible={showImport} transparent animationType="slide" onRequestClose={() => setShowImport(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ flex: 1, backgroundColor: colors.background, marginTop: 80, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={[styles.h1, { color: colors.foreground, fontSize: 22 }]}>Import Data</Text>
              <Pressable onPress={() => setShowImport(false)}>
                <Feather name="x" size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 10, fontFamily: "Inter_400Regular" }}>
              Paste previously exported JSON. This overwrites keys that match.
            </Text>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder='{"nextsteps_quiz_v1": {...}, ...}'
              placeholderTextColor={colors.mutedForeground}
              style={{
                flex: 1, backgroundColor: colors.muted, color: colors.foreground,
                borderRadius: 10, padding: 12, fontSize: 12, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                textAlignVertical: "top", marginBottom: 14,
              }}
            />
            <Pressable style={[styles.bigCta, { backgroundColor: colors.primary }]} onPress={runImport}>
              <Feather name="upload" size={18} color="white" />
              <Text style={styles.bigCtaText}>Import</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* RESET CONFIRM MODAL */}
      <Modal visible={confirmReset} transparent animationType="fade" onRequestClose={() => setConfirmReset(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 22, maxWidth: 400, width: "100%" }}>
            <Feather name="alert-triangle" size={32} color={colors.destructive} style={{ alignSelf: "center", marginBottom: 10 }} />
            <Text style={{ color: colors.foreground, fontSize: 20, fontFamily: "Inter_800ExtraBold", textAlign: "center", marginBottom: 8 }}>
              Reset all progress?
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: "center", marginBottom: 18, fontFamily: "Inter_400Regular", lineHeight: 20 }}>
              This erases quiz scores, campaign scores, characters, custom levels, budget, checklist, and tax doc tracker from this device. It cannot be undone.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={[styles.bigCta, { backgroundColor: colors.muted, flex: 1 }]} onPress={() => setConfirmReset(false)}>
                <Text style={[styles.bigCtaText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.bigCta, { backgroundColor: colors.destructive, flex: 1 }]} onPress={runReset}>
                <Text style={styles.bigCtaText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function CharactersScreen({ colors, characters, onAdd, onDelete }: any) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>CHARACTERS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Your characters</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Save character profiles you can reuse across campaigns and custom levels. Modifiers shift starting stats, passive drains, and law-heat multipliers.
      </Text>

      {characters.length === 0 ? (
        <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.setupQ, { color: colors.mutedForeground }]}>
            No saved characters yet. Tap below to make your first one.
          </Text>
        </View>
      ) : (
        characters.map((c: SavedCharacter) => (
          <View key={c.id} style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.setupLabel, { color: colors.foreground }]}>{c.name}</Text>
                <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>
                  {c.presetKey === "custom" ? "CUSTOM" : (CHARACTER_PRESETS.find(p => p.key === c.presetKey)?.name.toUpperCase() || "PRESET")}
                </Text>
              </View>
              <Pressable onPress={() => onDelete(c.id)} hitSlop={10}>
                <Feather name="trash-2" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {c.modifiers
                .filter(m => !modifierDefs[m]?.neutral)
                .map(m => (
                  <View key={m} style={[styles.chip, { backgroundColor: colors.warningSoft }]}>
                    <Text style={{ color: colors.warning, fontSize: 11, fontFamily: "Inter_600SemiBold" }}>
                      {modifierDefs[m]?.name || m}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        ))
      )}

      <Pressable style={[styles.bigCta, { backgroundColor: colors.primary, marginTop: 12 }]} onPress={onAdd}>
        <Feather name="plus" size={20} color="white" />
        <Text style={styles.bigCtaText}>Add Character</Text>
      </Pressable>
    </ScrollView>
  );
}

// ============================================================
// CHARACTER CREATOR (preset picker — 5 cards including Custom)
// ============================================================
function CharacterCreatorScreen({ colors, existing, onPickPreset, onCustom, onCancel }: any) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Pressable onPress={onCancel} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Feather name="chevron-left" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Cancel</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>NEW CHARACTER</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Pick a starting point</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Four common archetypes, or build one from scratch. Custom lets you pick every modifier yourself.
      </Text>

      {CHARACTER_PRESETS.map(p => (
        <Pressable key={p.key} onPress={() => onPickPreset(p.key)} style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.setupLabel, { color: colors.foreground }]}>{p.name}</Text>
          <Text style={[styles.trackDesc, { color: colors.mutedForeground, marginTop: 4 }]}>{p.desc}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {p.mods
              .filter(m => !modifierDefs[m]?.neutral)
              .map(m => (
                <View key={m} style={[styles.chip, { backgroundColor: colors.warningSoft }]}>
                  <Text style={{ color: colors.warning, fontSize: 11, fontFamily: "Inter_600SemiBold" }}>
                    {modifierDefs[m]?.name || m}
                  </Text>
                </View>
              ))}
          </View>
        </Pressable>
      ))}

      <Pressable onPress={onCustom} style={[styles.setupCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 2 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Feather name="sliders" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.setupLabel, { color: colors.primary }]}>Custom</Text>
            <Text style={[styles.trackDesc, { color: colors.primary, marginTop: 2 }]}>
              Pick every modifier yourself. 8 categories, full control.
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </View>
      </Pressable>
    </ScrollView>
  );
}

// ============================================================
// CUSTOM CHARACTER CREATOR (name input + full 8-group modifier picker)
// ============================================================
function CustomCharacterCreatorScreen({ colors, existing, onSave, onCancel }: any) {
  const [name, setName] = useState<string>(nextCharacterName(existing || [], "Custom"));
  const [selections, setSelections] = useState<Record<string, string>>({});
  const allPicked = modifierGroups.every(g => selections[g.id]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Pressable onPress={onCancel} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Feather name="chevron-left" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Back</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>CUSTOM CHARACTER</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Build your character</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Pick one option in each category. Your answers shift starting stats and how likely things go right or wrong.
      </Text>

      <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setupLabel, { color: colors.foreground }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.mutedForeground}
          style={{
            backgroundColor: colors.muted, color: colors.foreground,
            borderWidth: 1, borderColor: colors.border, borderRadius: 10,
            padding: 10, fontSize: 15, fontFamily: "Inter_500Medium", marginTop: 6,
          }}
        />
      </View>

      {modifierGroups.map(g => (
        <View key={g.id} style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.setupLabel, { color: colors.foreground }]}>{g.label}</Text>
          <Text style={[styles.setupQ, { color: colors.mutedForeground }]}>{g.q}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {g.opts.map(o => {
              const selected = selections[g.id] === o.val;
              return (
                <Pressable
                  key={o.val}
                  onPress={() => setSelections({ ...selections, [g.id]: o.val })}
                  style={[styles.setupOpt, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.card }]}
                >
                  <Text style={[styles.setupOptT, { color: colors.foreground }]}>{o.t}</Text>
                  <Text style={[styles.setupOptD, { color: colors.mutedForeground }]}>{o.d}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Pressable
        disabled={!allPicked}
        onPress={() => onSave(name.trim(), modifierGroups.map(g => selections[g.id]))}
        style={[styles.bigCta, { backgroundColor: allPicked ? colors.primary : colors.muted, marginTop: 16 }]}
      >
        <Feather name="check" size={20} color={allPicked ? "white" : colors.mutedForeground} />
        <Text style={[styles.bigCtaText, { color: allPicked ? "white" : colors.mutedForeground }]}>Save Character</Text>
      </Pressable>
    </ScrollView>
  );
}

// ============================================================
// CHARACTER PICK (shown before launching a scenario — default or saved)
// ============================================================
function CharacterPickScreen({ colors, title, subtitle, defaultCharName, characters, onDefault, onPickCharacter, onCreateFirst, onCancel }: any) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Pressable onPress={onCancel} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Feather name="chevron-left" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Cancel</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>{String(title).toUpperCase()}</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>{subtitle}</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Play as the scenario's default character or bring in one you've made.
      </Text>

      <Pressable onPress={onDefault} style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[styles.toolIcon, { backgroundColor: colors.secondarySoft }]}>
            <Feather name="user" size={22} color={colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.setupLabel, { color: colors.foreground }]}>Default</Text>
            <Text style={[styles.trackDesc, { color: colors.mutedForeground, marginTop: 2 }]}>
              Play as {defaultCharName}. No modifiers, scenario as written.
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </View>
      </Pressable>

      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>YOUR CHARACTERS ({characters.length})</Text>
      {characters.length === 0 ? (
        <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.setupQ, { color: colors.mutedForeground, marginBottom: 10 }]}>
            You haven't made any characters yet. Create one to use modifiers on this scenario.
          </Text>
          <Pressable style={[styles.bigCta, { backgroundColor: colors.primary }]} onPress={onCreateFirst}>
            <Feather name="plus" size={20} color="white" />
            <Text style={styles.bigCtaText}>Create a Character</Text>
          </Pressable>
        </View>
      ) : (
        characters.map((ch: SavedCharacter) => (
          <Pressable key={ch.id} onPress={() => onPickCharacter(ch)} style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.setupLabel, { color: colors.foreground }]}>{ch.name}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {ch.modifiers
                .filter(m => !modifierDefs[m]?.neutral)
                .slice(0, 8)
                .map(m => (
                  <View key={m} style={[styles.chip, { backgroundColor: colors.warningSoft }]}>
                    <Text style={{ color: colors.warning, fontSize: 11, fontFamily: "Inter_600SemiBold" }}>
                      {modifierDefs[m]?.name || m}
                    </Text>
                  </View>
                ))}
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

// ============================================================
// LEVEL EDITOR
// ============================================================
function LevelEditorList({ colors, levels, onRefresh, onEdit, onPlay }: any) {
  const [exportOpen, setExportOpen] = useState<CustomLevel | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const handleImport = async () => {
    try {
      const obj = JSON.parse(importText);
      if (!obj.scenes || !obj.startSceneId) throw new Error("Missing scenes or startSceneId");
      obj.id = "lvl_" + Math.random().toString(36).slice(2, 10);
      await upsertLevel(obj as CustomLevel);
      await onRefresh();
      setImportOpen(false);
      setImportText("");
    } catch (e: any) {
      Alert.alert("Import failed", e?.message || "Invalid level JSON.");
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>LEVEL DESIGN</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Your custom levels</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 16 }]}>
        Build scenarios with the same engine as the campaigns. Export yours to share; import levels friends send you.
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          style={[styles.bigCta, { backgroundColor: colors.primary, flex: 1 }]}
          onPress={async () => { const lvl = blankLevel(); await upsertLevel(lvl); await onRefresh(); onEdit(lvl.id); }}
        >
          <Feather name="plus" size={20} color="white" />
          <Text style={styles.bigCtaText}>New Level</Text>
        </Pressable>
        <Pressable
          style={[styles.bigCta, { backgroundColor: colors.muted, paddingHorizontal: 16 }]}
          onPress={() => setImportOpen(true)}
        >
          <Feather name="download" size={18} color={colors.foreground} />
          <Text style={[styles.bigCtaText, { color: colors.foreground, fontSize: 13 }]}>Import</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 20 }}>
        {levels.length === 0 ? (
          <Text style={[styles.modeHint, { color: colors.mutedForeground }]}>
            No levels yet. Tap "New Level" to start from a template or Import a JSON file someone shared.
          </Text>
        ) : (
          levels.map((lvl: CustomLevel) => (
            <View key={lvl.id} style={[styles.customCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.trackTitle, { color: colors.foreground }]}>{lvl.name}</Text>
              <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>{lvl.scenes.length} scenes · {lvl.lessons?.length || 0} lessons</Text>
              <Text style={[styles.trackDesc, { color: colors.mutedForeground, marginTop: 4 }]} numberOfLines={2}>{lvl.desc}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <SmallBtn colors={colors} kind="primary" label="▶ Play" onPress={() => onPlay(lvl)} />
                <SmallBtn colors={colors} kind="secondary" label="✎ Edit" onPress={() => onEdit(lvl.id)} />
                <SmallBtn colors={colors} kind="muted" label="⬇ Export" onPress={() => setExportOpen(lvl)} />
                <SmallBtn colors={colors} kind="muted" label="Delete" onPress={async () => { await removeLevel(lvl.id); await onRefresh(); }} />
              </View>
            </View>
          ))
        )}
      </View>

      {/* Export modal — selectable JSON */}
      <Modal visible={!!exportOpen} transparent animationType="slide" onRequestClose={() => setExportOpen(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ flex: 1, backgroundColor: colors.background, marginTop: 80, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={[styles.h1, { color: colors.foreground, fontSize: 22 }]}>Export Level</Text>
              <Pressable onPress={() => setExportOpen(null)}><Feather name="x" size={24} color={colors.mutedForeground} /></Pressable>
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 10, fontFamily: "Inter_400Regular" }}>
              Copy this JSON and share it. Recipients paste it into their Import dialog.
            </Text>
            <ScrollView style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 10, padding: 12 }}>
              <Text selectable style={{ color: colors.foreground, fontSize: 11, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
                {exportOpen ? JSON.stringify(exportOpen, null, 2) : ""}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Import modal */}
      <Modal visible={importOpen} transparent animationType="slide" onRequestClose={() => setImportOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ flex: 1, backgroundColor: colors.background, marginTop: 80, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={[styles.h1, { color: colors.foreground, fontSize: 22 }]}>Import Level</Text>
              <Pressable onPress={() => setImportOpen(false)}><Feather name="x" size={24} color={colors.mutedForeground} /></Pressable>
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 10, fontFamily: "Inter_400Regular" }}>
              Paste a level JSON here. A new ID will be assigned so you won't overwrite an existing level.
            </Text>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder='{"name": "...", "scenes": [...]}'
              placeholderTextColor={colors.mutedForeground}
              style={{
                flex: 1, backgroundColor: colors.muted, color: colors.foreground,
                borderRadius: 10, padding: 12, fontSize: 12,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                textAlignVertical: "top", marginBottom: 14,
              }}
            />
            <Pressable style={[styles.bigCta, { backgroundColor: colors.primary }]} onPress={handleImport}>
              <Feather name="check" size={18} color="white" />
              <Text style={styles.bigCtaText}>Import Level</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function LevelEditorScreen({ colors, levelId, onDone }: any) {
  const [lvl, setLvl] = useState<CustomLevel | null>(null);
  const [activeScene, setActiveScene] = useState<string | null>(null);

  useEffect(() => {
    loadLevels().then(list => {
      const found = list.find(l => l.id === levelId);
      if (found) setLvl(JSON.parse(JSON.stringify(found)));
    });
  }, [levelId]);

  if (!lvl) return <View />;

  const save = async () => { await upsertLevel(lvl); onDone(); };

  const updateMeta = (key: string, value: any) => {
    const next = { ...lvl, [key]: value };
    setLvl(next);
  };

  const addScene = (isEnding: boolean) => {
    const id = isEnding ? "end_" + newSceneId() : newSceneId();
    const scene = isEnding
      ? { id, title: "New Ending", text: "{name}. End of the line.", ending: true, endingKind: "mid" as const }
      : { id, title: "New Scene", text: "Describe what's happening...", choices: [] };
    setLvl({ ...lvl, scenes: [...lvl.scenes, scene] });
  };

  const editingScene = activeScene ? lvl.scenes.find(s => s.id === activeScene) : null;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <Pressable style={[styles.smallBtn, { backgroundColor: colors.primary }]} onPress={save}>
          <Text style={{ color: "white", fontFamily: "Inter_700Bold", fontSize: 13 }}>💾 Save & Close</Text>
        </Pressable>
        <Pressable style={[styles.smallBtn, { backgroundColor: colors.muted }]} onPress={onDone}>
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Cancel</Text>
        </Pressable>
      </View>

      <Text style={[styles.eyebrow, { color: colors.primary }]}>METADATA</Text>
      <View style={[styles.editorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <EdInput colors={colors} label="Name" value={lvl.name} onChangeText={(v: string) => updateMeta("name", v)} />
        <EdInput colors={colors} label="Character subtitle" value={lvl.who} onChangeText={(v: string) => updateMeta("who", v)} />
        <EdInput colors={colors} label="Description" value={lvl.desc} onChangeText={(v: string) => updateMeta("desc", v)} multiline />
        <EdInput colors={colors} label="Default name" value={lvl.defaultName} onChangeText={(v: string) => updateMeta("defaultName", v)} />
        <EdInput colors={colors} label="Starting money ($)" value={String(lvl.startMoney)} onChangeText={(v: string) => updateMeta("startMoney", parseInt(v) || 0)} keyboardType="numeric" />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>SCENES ({lvl.scenes.length})</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <SmallBtn colors={colors} kind="primary" label="+ Scene" onPress={() => addScene(false)} />
          <SmallBtn colors={colors} kind="secondary" label="+ Ending" onPress={() => addScene(true)} />
        </View>
      </View>

      {lvl.scenes.map(sc => (
        <Pressable key={sc.id} onPress={() => setActiveScene(sc.id)} style={[styles.scenePill, {
          backgroundColor: colors.card,
          borderColor: sc.ending ? (sc.endingKind === "bad" ? colors.destructive : sc.endingKind === "good" ? colors.success : colors.warning) : colors.border,
          borderLeftWidth: sc.ending ? 4 : 1,
        }]}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>#{sc.id}</Text>
          <Text style={[styles.trackTitle, { color: colors.foreground, fontSize: 15 }]}>{sc.ending ? "🏁 " : ""}{sc.title}</Text>
          {sc.id === lvl.startSceneId && (
            <View style={{ backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start" }}>
              <Text style={{ color: colors.primary, fontSize: 10, fontFamily: "Inter_800ExtraBold" }}>START</Text>
            </View>
          )}
        </Pressable>
      ))}

      {/* Scene editor modal */}
      <Modal visible={!!editingScene} transparent animationType="slide" onRequestClose={() => setActiveScene(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ flex: 1, backgroundColor: colors.background, marginTop: 60, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <ScrollView>
              {editingScene && (
                <SceneEditor
                  colors={colors}
                  scene={editingScene}
                  allScenes={lvl.scenes}
                  onChange={(updated: CustomLevel["scenes"][number]) => {
                    const scenes = lvl.scenes.map(s => s.id === updated.id ? updated : s);
                    setLvl({ ...lvl, scenes });
                  }}
                  onClose={() => setActiveScene(null)}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function SceneEditor({ colors, scene, allScenes, onChange, onClose }: any) {
  const update = (key: string, value: any) => onChange({ ...scene, [key]: value });
  const addChoice = () => {
    const ch = { label: "New choice", kind: "mid", feedback: "", effects: {}, nextId: allScenes.find((s: any) => s.ending)?.id || "finale" };
    update("choices", [...(scene.choices || []), ch]);
  };
  const updateChoice = (i: number, patch: any) => {
    const list = [...(scene.choices || [])];
    list[i] = { ...list[i], ...patch };
    update("choices", list);
  };
  const updateChoiceEffect = (i: number, key: string, value: any) => {
    const list = [...(scene.choices || [])];
    const cur = list[i];
    list[i] = { ...cur, effects: { ...(cur.effects || {}), [key]: value } };
    update("choices", list);
  };
  const removeChoice = (i: number) => {
    const list = [...(scene.choices || [])];
    list.splice(i, 1);
    update("choices", list);
  };

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={[styles.h1, { color: colors.foreground, fontSize: 22 }]}>{scene.ending ? "🏁 Edit Ending" : "Edit Scene"}</Text>
        <Pressable onPress={onClose}>
          <Feather name="x" size={24} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <EdInput colors={colors} label="Scene ID" value={scene.id} editable={false} />
      <EdInput colors={colors} label="Title" value={scene.title} onChangeText={(v: string) => update("title", v)} />
      <EdInput colors={colors} label={scene.ending ? "Ending text (use {name})" : "Narrative (use {name})"} value={scene.text} onChangeText={(v: string) => update("text", v)} multiline />

      {scene.ending ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.edLabel, { color: colors.mutedForeground }]}>ENDING KIND</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {["good", "mid", "bad"].map(k => {
              const active = scene.endingKind === k;
              const kc = k === "good" ? colors.success : k === "bad" ? colors.destructive : colors.warning;
              return (
                <Pressable key={k} onPress={() => update("endingKind", k)} style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: active ? kc : colors.muted,
                  borderWidth: 2, borderColor: active ? kc : colors.border,
                }}>
                  <Text style={{ color: active ? "white" : colors.foreground, fontFamily: "Inter_700Bold" }}>{k}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <Text style={[styles.edLabel, { color: colors.mutedForeground }]}>CHOICES ({(scene.choices || []).length})</Text>
            <SmallBtn colors={colors} kind="primary" label="+ Choice" onPress={addChoice} />
          </View>
          {(scene.choices || []).map((c: any, i: number) => (
            <View key={i} style={[styles.editorCard, { backgroundColor: colors.muted, borderColor: colors.border, marginTop: 10 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ color: colors.primary, fontFamily: "Inter_800ExtraBold" }}>Choice {i + 1}</Text>
                <Pressable onPress={() => removeChoice(i)}>
                  <Text style={{ color: colors.destructive, fontFamily: "Inter_700Bold", fontSize: 12 }}>Remove</Text>
                </Pressable>
              </View>
              <EdInput colors={colors} label="Label" value={c.label} onChangeText={(v: string) => updateChoice(i, { label: v })} multiline />
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
                {["good", "mid", "bad"].map(k => {
                  const active = c.kind === k;
                  const kc = k === "good" ? colors.success : k === "bad" ? colors.destructive : colors.warning;
                  return (
                    <Pressable key={k} onPress={() => updateChoice(i, { kind: k })} style={{
                      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: active ? kc : colors.card,
                      borderWidth: 2, borderColor: active ? kc : colors.border,
                    }}>
                      <Text style={{ color: active ? "white" : colors.foreground, fontFamily: "Inter_700Bold", fontSize: 12 }}>{k}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <EdInput colors={colors} label="Feedback" value={c.feedback} onChangeText={(v: string) => updateChoice(i, { feedback: v })} multiline />
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <View style={{ flex: 1, minWidth: 120 }}>
                  <EdInput colors={colors} label="Money" value={String(c.effects?.money || 0)} onChangeText={(v: string) => updateChoiceEffect(i, "money", parseInt(v) || 0)} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1, minWidth: 120 }}>
                  <EdInput colors={colors} label="Health" value={String(c.effects?.health || 0)} onChangeText={(v: string) => updateChoiceEffect(i, "health", parseInt(v) || 0)} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1, minWidth: 120 }}>
                  <EdInput colors={colors} label="Wellbeing" value={String(c.effects?.wellbeing || 0)} onChangeText={(v: string) => updateChoiceEffect(i, "wellbeing", parseInt(v) || 0)} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1, minWidth: 120 }}>
                  <EdInput colors={colors} label="Law heat" value={String(c.effects?.law || 0)} onChangeText={(v: string) => updateChoiceEffect(i, "law", parseInt(v) || 0)} keyboardType="numeric" />
                </View>
              </View>
              <EdInput colors={colors} label="Add flags (comma-separated)"
                value={(c.effects?.addFlags || []).join(", ")}
                onChangeText={(v: string) => updateChoiceEffect(i, "addFlags", v.split(",").map(s => s.trim()).filter(Boolean))}
              />
              <Text style={[styles.edLabel, { color: colors.mutedForeground }]}>GO TO SCENE NEXT</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {allScenes.map((s: any) => {
                  const active = c.nextId === s.id;
                  return (
                    <Pressable key={s.id} onPress={() => updateChoice(i, { nextId: s.id })} style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                      backgroundColor: active ? colors.primary : colors.card,
                      borderWidth: 1, borderColor: active ? colors.primary : colors.border,
                    }}>
                      <Text style={{ color: active ? "white" : colors.foreground, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>{s.id}</Text>
                    </Pressable>
                  );
                })}
                <Pressable onPress={() => updateChoice(i, { nextId: "finale" })} style={{
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                  backgroundColor: c.nextId === "finale" ? colors.primary : colors.card,
                  borderWidth: 1, borderColor: c.nextId === "finale" ? colors.primary : colors.border,
                }}>
                  <Text style={{ color: c.nextId === "finale" ? "white" : colors.foreground, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>finale</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}

      <Pressable style={[styles.bigCta, { backgroundColor: colors.primary, marginTop: 20 }]} onPress={onClose}>
        <Feather name="check" size={20} color="white" />
        <Text style={styles.bigCtaText}>Done</Text>
      </Pressable>
    </View>
  );
}

function EdInput({ colors, label, value, onChangeText, multiline, editable, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[styles.edLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        editable={editable !== false}
        keyboardType={keyboardType || "default"}
        placeholderTextColor={colors.mutedForeground}
        style={{
          backgroundColor: colors.card, color: colors.foreground,
          borderWidth: 1, borderColor: colors.border,
          borderRadius: 10, padding: 10, fontSize: 14,
          minHeight: multiline ? 80 : 40,
          fontFamily: "Inter_400Regular",
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontFamily: "Inter_800ExtraBold", letterSpacing: 1.4, marginBottom: 6 },
  h1: { fontSize: 32, fontFamily: "Inter_800ExtraBold", lineHeight: 38, marginBottom: 4 },
  sub: { fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 19, fontFamily: "Inter_700Bold" },
  sectionEyebrow: { fontSize: 11, fontFamily: "Inter_800ExtraBold", letterSpacing: 1.4, marginTop: 22, marginBottom: 10 },

  tabBar: {
    flexDirection: "row", paddingVertical: 8, paddingHorizontal: 4,
    borderTopWidth: 1,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  tabLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 3 },

  dropdown: {
    position: "absolute", right: 12, bottom: 70,
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
    minWidth: 220,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 12,
  },
  dropdownItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  dropdownIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  dropdownLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },

  heroCard: { borderRadius: 20, padding: 20, marginBottom: 4 },
  heroLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: "Inter_800ExtraBold", letterSpacing: 1.4 },
  heroNum: { color: "white", fontSize: 30, fontFamily: "Inter_800ExtraBold" },
  heroSubLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 2 },
  heroDiv: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.3)" },

  quickCard: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "flex-start", gap: 10 },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },

  trackCard: {
    flexDirection: "row", borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 10,
  },
  trackAccent: { width: 4 },
  trackTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  trackWho: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1, marginTop: 2 },
  trackDesc: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  cardFooter: {
    marginTop: 10, paddingTop: 10, borderTopWidth: 1,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  playBadge: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  segmented: {
    flexDirection: "row", borderRadius: 12, padding: 4, borderWidth: 1, marginBottom: 14,
  },
  segItem: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center" },
  modeHint: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  bigCta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 14, borderRadius: 14, gap: 8,
  },
  bigCtaText: { color: "white", fontFamily: "Inter_700Bold", fontSize: 15 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  customCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },

  setupCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  setupLabel: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  setupQ: { fontSize: 13, marginBottom: 10, fontFamily: "Inter_400Regular" },
  setupOpt: { flexBasis: "48%", flexGrow: 1, padding: 12, borderRadius: 10, borderWidth: 2 },
  setupOptT: { fontSize: 14, fontFamily: "Inter_700Bold" },
  setupOptD: { fontSize: 12, marginTop: 4, fontFamily: "Inter_400Regular", lineHeight: 16 },

  sceneCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginTop: 4, marginBottom: 12 },
  sceneTitle: { fontSize: 11, fontFamily: "Inter_800ExtraBold", letterSpacing: 1.4, marginBottom: 8 },
  sceneText: { fontSize: 15, lineHeight: 22, fontFamily: "Inter_400Regular" },

  choiceBtn: {
    padding: 14, borderRadius: 12, borderWidth: 1.5,
    flexDirection: "row", marginBottom: 8, gap: 8,
  },
  choiceLetter: { fontFamily: "Inter_800ExtraBold", width: 24 },
  choiceLabel: { flex: 1, fontSize: 14, lineHeight: 20, fontFamily: "Inter_500Medium" },

  statCell: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 8 },
  statLabel: { fontSize: 10, fontFamily: "Inter_800ExtraBold", letterSpacing: 0.8 },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 2 },
  statBarBg: { height: 4, borderRadius: 4, marginTop: 6, overflow: "hidden" },
  statBarFill: { height: "100%", borderRadius: 4 },

  lawCard: { borderRadius: 10, borderWidth: 1, padding: 8, marginTop: 8, marginBottom: 4 },

  feedback: { borderRadius: 12, padding: 12, borderWidth: 1, marginTop: 8, marginBottom: 4 },

  endingCard: { borderRadius: 18, borderWidth: 2, padding: 24, marginBottom: 14 },
  endingTitle: { fontSize: 24, fontFamily: "Inter_800ExtraBold", textAlign: "center", marginBottom: 12 },
  endingBody: { fontSize: 15, lineHeight: 23, textAlign: "center", marginBottom: 12, fontFamily: "Inter_400Regular" },
  endingMeta: { fontSize: 12, textAlign: "center", fontFamily: "Inter_600SemiBold" },

  reason: { flexDirection: "row", padding: 11, borderRadius: 10, borderWidth: 1, marginBottom: 6 },

  lessonCard: { padding: 14, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, marginBottom: 8 },
  lessonT: { fontSize: 15, fontFamily: "Inter_700Bold" },
  lessonD: { fontSize: 13, lineHeight: 20, marginTop: 4, fontFamily: "Inter_400Regular" },

  toolCard: { flexDirection: "row", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 12, alignItems: "center" },
  toolIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  themeBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },

  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },

  editorCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  edLabel: { fontSize: 11, fontFamily: "Inter_800ExtraBold", letterSpacing: 0.8, marginBottom: 4 },

  scenePill: {
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8, gap: 4,
  },
});
