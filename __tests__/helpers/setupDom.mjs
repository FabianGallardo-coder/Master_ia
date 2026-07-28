// Test-only helper: populate jsdom document.body with the DOM ids a test
// references. Each id is created with the most permissive element type the
// existing tests touch — the tests poke `.value` / `.textContent` / `.checked`,
// so we pick tag by suffix (Input/Textarea → textarea, Slider → input, otherwise div).
//
// ponytail: tags are inferred by suffix; if a test needs a specific tag it
//           can replace the element after calling setupDom().

const TAG_BY_SUFFIX = [
  [/Input$/,    'textarea'],
  [/Textarea$/, 'textarea'],
  [/Slider$/,   'input'],
  [/^sendBtn$/, 'button'],
  [/Btn$/,      'button'],
  // Settings form fields: explicit ids.
  [/^(ollamaUrl|modelSelect|systemPrompt|temperature|topP|maxTokens|devModeToggle)$/, 'input'],
];

function pickTag(id) {
  for (const [re, tag] of TAG_BY_SUFFIX) if (re.test(id)) return tag;
  return 'div';
}

export function setupDom(ids = []) {
  for (const id of ids) {
    if (typeof document === 'undefined') continue;
    if (document.getElementById(id)) continue;
    const el = document.createElement(pickTag(id));
    el.id = id;
    document.body.appendChild(el);
  }
  return document.body;
}

// Common defaults for tests that don't care which ids they need.
export const COMMON_IDS = Object.freeze([
  'modeSelector','modeHard','modeRegular','modeDeep','modeLow','modeReverse',
  'timerTime','timerPhase','timerProgress','startBtn','resetBtn',
  'breakOverlay','breakSuggestion','breakTimer','endBreakBtn',
  'sessionsCount','totalMinutes','streakCount','energySlider','energyValue',
  'skillsGrid','addSkillBtn','skillForm','skillName','skillType',
  'updateSkillForm','editSkillName','editSkillType',
  'skillTaskForm','taskDescription',
  'scheduleColumns','scheduleCalendar','calTitle','calPrev','calNext',
  'addTaskBtn','taskForm','taskTitle','taskSkill','taskBlocks',
  'chatInput','chatMessages','sendBtn','ollamaStatus','ollamaText',
  'ollamaUrl','modelSelect','customModel','systemPrompt',
  'temperature','tempValue','topP','topPValue','maxTokens',
  'devModeToggle','devModeToggleLabel','devModeSection',
  'testConnectionBtn','saveSettingsBtn','runEvaluationBtn','clearEvaluationBtn',
  'evalPrompt','evalConfigs','evalResults',
  'settingsStatus','statusUrl','presetFocus','presetCreative','presetConservative',
  'toastContainer',
  'linkType','skillSelect','taskDay','taskSelect',
  'timerCompleteType','timerCompleteSkill','timerCompleteDay','timerCompleteTask','timerCompleteBlocks',
  'skillSelection','taskSelection','taskDetailSelection',
]);