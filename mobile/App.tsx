import React, { useEffect, useMemo, useState } from "react";
import {
  Modal, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, View, useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";

import { lightColors, darkColors, Palette } from "./src/colors";
import { Choice, GameState, Scenario, Scene } from "./src/types";
import { SCENARIOS, SCENARIO_MAP } from "./src/scenarios";
import { modifierDefs, modifierGroups, applyStartingModifiers, applyPassiveDrains, hasMod, lawTick } from "./src/modifiers";
import { freshState, applyEffects, shufflePickOrder, pickChoice } from "./src/engine";
import { EDUCATION } from "./src/education";
import { CustomLevel, loadLevels, upsertLevel, removeLevel, blankLevel, newSceneId, evalRules, interpolate } from "./src/levelStore";
import { SavedCharacter, CHARACTER_PRESETS, loadCharacters, upsertCharacter, removeCharacter, newCharacterId, nextCharacterName } from "./src/characterStore";

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
  | { name: "home" }
  | { name: "learn" }
  | { name: "learn-detail"; scenarioId: string }
  | { name: "play" }
  | { name: "campaign-char-choice"; scenarioId: string }
  | { name: "custom-level-char-choice"; customId: string }
  | { name: "game" }
  | { name: "outcome" }
  | { name: "tools" }
  | { name: "progress" }
  | { name: "settings" }
  | { name: "characters" }
  | { name: "characters-create" }
  | { name: "characters-create-custom" }
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
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [moreOpen, setMoreOpen] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameScenario, setGameScenario] = useState<Scenario | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<any>(null);
  const [levels, setLevels] = useState<CustomLevel[]>([]);
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);

  // Reload custom levels + characters whenever the route changes.
  useEffect(() => {
    loadLevels().then(setLevels);
    loadCharacters().then(setCharacters);
  }, [route.name]);

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
    const before = { money: gameState.money, health: gameState.health, wellbeing: gameState.wellbeing, law: gameState.law };
    const result = pickChoice(gameState, choice, gameScenario);
    setGameState({ ...gameState });
    setPendingFeedback({
      kind: choice.kind,
      text: choice.feedback,
      delta: result.delta,
    });
    // Check for game-over endings
    const nextScene = gameScenario.scenes[result.nextSceneId];
    if (nextScene && (nextScene as any).ending) {
      setTimeout(() => setRoute({ name: "outcome" }), 0);
    }
    if (gameState.gameOver) {
      setTimeout(() => setRoute({ name: "outcome" }), 0);
    }
  };

  // ---------- ROUTE RENDER ----------
  let screen: React.ReactNode = null;
  const c = theme.colors;
  switch (route.name) {
    case "home":
      screen = <HomeScreen colors={c} onOpenLearn={() => nav({ name: "learn" })} onOpenPlay={() => nav({ name: "play" })} />;
      break;
    case "learn":
      screen = <LearnScreen colors={c} onPick={(id: string) => nav({ name: "learn-detail", scenarioId: id })} />;
      break;
    case "learn-detail":
      screen = <LearnDetailScreen colors={c} scenarioId={(route as any).scenarioId} onBack={() => nav({ name: "learn" })} />;
      break;
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
        onCreateFirst={() => nav({ name: "characters-create" })}
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
        onCreateFirst={() => nav({ name: "characters-create" })}
        onCancel={() => nav({ name: "play" })}
      />;
      break;
    }
    case "characters-create":
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
          nav({ name: "characters" });
        }}
        onCustom={() => nav({ name: "characters-create-custom" })}
        onCancel={() => nav({ name: "characters" })}
      />;
      break;
    case "characters-create-custom":
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
          nav({ name: "characters" });
        }}
        onCancel={() => nav({ name: "characters-create" })}
      />;
      break;
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
          eduPack={levels.find(l => l.id === gameScenario.id) ? customLevelToEducation(levels.find(l => l.id === gameScenario.id)!) : EDUCATION[gameScenario.id]}
          onHome={() => nav({ name: "home" })}
          onPlay={() => nav({ name: "play" })}
        />;
      }
      break;
    case "tools":
      screen = <ToolsScreen colors={c} />;
      break;
    case "progress":
      screen = <ProgressScreen colors={c} />;
      break;
    case "settings":
      screen = <SettingsScreen colors={c} theme={theme} />;
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
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <StatusBar barStyle={theme.resolved === "dark" ? "light-content" : "dark-content"} backgroundColor={c.background} />
      <View style={{ flex: 1 }}>
        {screen}
      </View>
      <BottomTabs colors={c} route={route} onNav={nav} onMore={() => setMoreOpen(v => !v)} moreActive={moreOpen} />
      <MoreDropdown
        visible={moreOpen} onClose={() => setMoreOpen(false)} colors={c}
        onPick={(where: string) => { setMoreOpen(false); nav({ name: where as any }); }}
      />
    </SafeAreaView>
  );
}

// ============================================================
// BOTTOM TAB BAR
// ============================================================
function BottomTabs({ colors, route, onNav, onMore, moreActive }: any) {
  const isActive = (names: string[]) => names.includes(route.name);
  const items = [
    { key: "home", label: "Home", icon: "home", active: isActive(["home"]), onPress: () => onNav({ name: "home" }) },
    { key: "learn", label: "Learn", icon: "book-open", active: isActive(["learn", "learn-detail"]), onPress: () => onNav({ name: "learn" }) },
    { key: "play", label: "Play", icon: "play-circle", active: isActive(["play", "campaign-char-choice", "custom-level-char-choice", "game", "outcome", "level-editor", "level-editor-list"]), onPress: () => onNav({ name: "play" }) },
    { key: "more", label: "More", icon: "more-horizontal", active: moreActive || isActive(["tools", "progress", "settings", "characters", "characters-create", "characters-create-custom"]), onPress: onMore },
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
function HomeScreen({ colors, onOpenLearn, onOpenPlay }: any) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>NEXT STEPS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Let's get adulting</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Real decisions, real consequences, one uncomfortable truth at a time.
      </Text>

      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroLabel}>YOUR PROGRESS</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 12 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.heroNum}>{SCENARIOS.length}</Text>
            <Text style={styles.heroSubLabel}>Scenarios</Text>
          </View>
          <View style={styles.heroDiv} />
          <View style={{ alignItems: "center" }}>
            <Text style={styles.heroNum}>3</Text>
            <Text style={styles.heroSubLabel}>Modes</Text>
          </View>
          <View style={styles.heroDiv} />
          <View style={{ alignItems: "center" }}>
            <Text style={styles.heroNum}>∞</Text>
            <Text style={styles.heroSubLabel}>Custom levels</Text>
          </View>
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
function LearnScreen({ colors, onPick }: any) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.secondary }]}>LESSONS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Review key takeaways</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Every scenario ships with real-world lessons. Study them before or after you play.
      </Text>
      {SCENARIOS.map(sc => (
        <Pressable key={sc.id} onPress={() => onPick(sc.id)} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.trackAccent, { backgroundColor: sc.accent }]} />
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={[styles.trackTitle, { color: colors.foreground }]}>{sc.name}</Text>
            <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>{(EDUCATION[sc.id]?.lessons.length || 0)} lessons</Text>
            <Text style={[styles.trackDesc, { color: colors.mutedForeground, marginTop: 6 }]} numberOfLines={2}>{sc.desc}</Text>
          </View>
          <View style={{ padding: 16, justifyContent: "center" }}>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function LearnDetailScreen({ colors, scenarioId, onBack }: any) {
  const sc = SCENARIO_MAP[scenarioId];
  const pack = EDUCATION[scenarioId];
  if (!sc || !pack) return null;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Pressable onPress={onBack} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <Feather name="chevron-left" size={20} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 4 }}>Back</Text>
      </Pressable>
      <Text style={[styles.eyebrow, { color: sc.accent }]}>{sc.name.toUpperCase()}</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Key takeaways</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>{sc.desc}</Text>
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
function OutcomeScreen({ colors, state, scenario, eduPack, onHome, onPlay }: any) {
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
function ToolsScreen({ colors }: any) {
  const tools = [
    { icon: "sliders", label: "Budget Builder", color: colors.primary, note: "Plan monthly income and expenses." },
    { icon: "check-square", label: "Lease Checklist", color: colors.wellbeing, note: "50 clauses to verify before signing." },
    { icon: "file-text", label: "Tax Doc Tracker", color: colors.secondary, note: "W-2s, 1099s, receipts by deadline." },
  ];
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>TOOLS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Practical helpers</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Checklists and calculators for real-world tasks. (Coming soon — interactive versions.)
      </Text>
      {tools.map(t => (
        <View key={t.label} style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.toolIcon, { backgroundColor: t.color + "22" }]}>
            <Feather name={t.icon as any} size={20} color={t.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.trackTitle, { color: colors.foreground }]}>{t.label}</Text>
            <Text style={[styles.trackDesc, { color: colors.mutedForeground, marginTop: 2 }]}>{t.note}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ProgressScreen({ colors }: any) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>PROGRESS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Your runs</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>
        Track completed scenarios and best endings. (In-progress — stats persist to device.)
      </Text>
      {SCENARIOS.map(sc => (
        <View key={sc.id} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.trackAccent, { backgroundColor: sc.accent }]} />
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={[styles.trackTitle, { color: colors.foreground }]}>{sc.name}</Text>
            <Text style={[styles.trackWho, { color: colors.mutedForeground }]}>Best run: — · Plays: 0</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function SettingsScreen({ colors, theme }: any) {
  const opts: { val: ThemeMode; label: string; icon: string }[] = [
    { val: "light", label: "Light", icon: "sun" },
    { val: "dark", label: "Dark", icon: "moon" },
    { val: "system", label: "Match System", icon: "monitor" },
  ];
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>SETTINGS</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Preferences</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 20 }]}>Control how the app looks.</Text>

      <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setupLabel, { color: colors.foreground }]}>Theme</Text>
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

      <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.setupLabel, { color: colors.foreground }]}>About</Text>
        <Text style={[styles.setupQ, { color: colors.mutedForeground }]}>
          Next Steps · v1.0 · Life skills education via branching scenarios. Built for young adults 17–25.
        </Text>
      </View>
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
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>LEVEL DESIGN</Text>
      <Text style={[styles.h1, { color: colors.foreground }]}>Your custom levels</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground, marginBottom: 16 }]}>
        Build scenarios with the same engine as the campaigns. Freeplay modifiers work on custom levels too.
      </Text>
      <Pressable
        style={[styles.bigCta, { backgroundColor: colors.primary }]}
        onPress={async () => { const lvl = blankLevel(); await upsertLevel(lvl); await onRefresh(); onEdit(lvl.id); }}
      >
        <Feather name="plus" size={20} color="white" />
        <Text style={styles.bigCtaText}>New Level</Text>
      </Pressable>
      <View style={{ marginTop: 20 }}>
        {levels.length === 0 ? (
          <Text style={[styles.modeHint, { color: colors.mutedForeground }]}>
            No levels yet. Tap "New Level" to start from a template.
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
                <SmallBtn colors={colors} kind="muted" label="Delete" onPress={async () => { await removeLevel(lvl.id); await onRefresh(); }} />
              </View>
            </View>
          ))
        )}
      </View>
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
