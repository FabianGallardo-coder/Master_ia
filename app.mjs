// app.mjs — extracted verbatim from index.html (lines 1132-2748).
// Exposes the Maestro IA renderer logic as an ES module so tests can
// import individual functions instead of round-tripping through jsdom.
//
// Browser: loaded via <script type="module" src="app.mjs"></script>;
// the IIFE at the bottom auto-attaches every named function to window
// and delegation listeners resolve data-action attributes (CSP-safe).
// Tests: import { foo } from "../app.mjs" directly.

const MODES = [
    { id: 'hard', name: 'Arranque difícil', work: 5, break: 2, desc: 'Para cuando cuesta empezar' },
    { id: 'regular', name: 'Estudio regular', work: 15, break: 5, desc: 'Lectura y ejercicios' },
    { id: 'deep', name: 'Trabajo profundo', work: 35, break: 8, desc: 'Escritura y programación' },
    { id: 'low', name: 'Baja energía', work: 10, break: 5, desc: 'Tardes y fatiga' },
    { id: 'reverse', name: 'Reverse', work: 2, break: 10, desc: 'Bloqueo extremo' }
];

const BREAK_ACTIVITIES = [
    'Estira el cuello y hombros lentamente por 60 segundos',
    'Toma un vaso de agua y respira profundo 3 veces',
    'Camina 2 minutos (puede ser dentro de tu cuarto)',
    'Grounding: nombra 3 cosas que ves, 2 que tocas, 1 que escuchas',
    'Cierra los ojos 30 segundos y siente tus pies en el suelo',
    'Agita las manos 30 segundos para soltar tensión'
];

const state = {
    energy: 3,
    selectedMode: 'regular',
    timerRunning: false,
    isBreak: false,
    timeRemaining: 15 * 60,
    totalTime: 15 * 60,
    sessionsToday: 0,
    totalMinutesToday: 0,
    streak: 0,
    sessionHistory: [],
    calendarView: 'columns',
    calendarCursor: new Date(),
    settings: {
        ollamaUrl: 'http://localhost:11434',
        model: 'qwen2.5-coder:3b',
        systemPrompt: 'Eres Maestro IA, asistente de estudio para alguien con TDAH y burnout.\nEl usuario aprende: RPG Maker, Godot 2D, Apache NiFi con Docker/Impala, e inglés.\nSé directo, amable, da pasos concretos. Responde en español. Máximo 3 párrafos.',
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 512,
        devMode: false
    },
    skills: [
        {
            id: 'rpgmaker', name: 'RPG Maker XP/MV', type: 'Game Dev',
            status: 'pending', progress: 0,
            tasks: [
                { text: 'Instalar RPG Maker', done: false },
                { text: 'Completar tutorial oficial', done: false },
                { text: 'Crear primer mapa', done: false },
                { text: 'Implementar sistema de batalla', done: false }
            ]
        },
        {
            id: 'godot', name: 'Godot 2D', type: 'Game Dev',
            status: 'pending', progress: 0,
            tasks: [
                { text: 'Instalar Godot', done: false },
                { text: 'Tutorial "Your First 2D Game"', done: false },
                { text: 'Crear escena con sprites', done: false },
                { text: 'Implementar movimiento del jugador', done: false }
            ]
        },
        {
            id: 'nifi', name: 'Apache NiFi 2.10.00', type: 'Data Engineering',
            status: 'pending', progress: 0,
            tasks: [
                { text: 'Instalar Docker Desktop', done: false },
                { text: 'Levantar NiFi con Docker Compose', done: false },
                { text: 'Conectar con Impala', done: false },
                { text: 'Crear primer flujo de datos', done: false }
            ]
        },
        {
            id: 'english', name: 'Validación de Inglés', type: 'Idioma',
            status: 'pending', progress: 0,
            tasks: [
                { text: 'Determinar nivel actual (test)', done: false },
                { text: 'Practicar 30min/día', done: false },
                { text: 'Simular examen de validación', done: false }
            ]
        }
    ]
};

const INITIAL_STATE = JSON.parse(JSON.stringify(state));

let timerInterval = null;
let breakInterval = null;
let ollamaAvailable = false;
let alertAudio = null;
function preloadAlert() {
    if (typeof Audio !== 'undefined' && !alertAudio) {
        alertAudio = new Audio('assets/sound/alert.mp3');
        alertAudio.load();
    }
}

// Timer functions
function getMode() { return MODES.find(m => m.id === state.selectedMode); }

function selectMode(modeId) {
    state.selectedMode = modeId;
    const mode = getMode();
    state.timeRemaining = mode.work * 60;
    state.totalTime = mode.work * 60;
    state.isBreak = false;
    updateTimerDisplay();
    renderModes();
    saveState();
}

function renderModes() {
    const container = document.getElementById('modeSelector');
    container.innerHTML = MODES.map(m => `
        <button class="mode-btn ${m.id === state.selectedMode ? 'active' : ''}" data-action="selectMode" data-args='["${m.id}"]'>
            ${m.name}
            <span class="mode-times">${m.work}m / ${m.break}m</span>
        </button>
    `).join('');
}

function updateTimerDisplay() {
    const mins = Math.floor(state.timeRemaining / 60);
    const secs = state.timeRemaining % 60;
    document.getElementById('timerTime').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    const phase = document.getElementById('timerPhase');
    if (state.isBreak) {
        phase.textContent = 'Descanso';
        phase.className = 'timer-phase break';
    } else if (state.timerRunning) {
        phase.textContent = 'Enfócate';
        phase.className = 'timer-phase work';
    } else {
        phase.textContent = 'Listo para comenzar';
        phase.className = 'timer-phase';
    }
    
    const progress = document.getElementById('timerProgress');
    const circumference = 2 * Math.PI * 130;
    const offset = circumference * (1 - state.timeRemaining / state.totalTime);
    progress.style.strokeDasharray = circumference;
    progress.style.strokeDashoffset = offset;
    progress.setAttribute('class', `timer-ring-progress ${state.isBreak ? 'break' : ''}`);
}

function startTimer() {
    if (state.timerRunning) {
        pauseTimer();
        return;
    }
    
    state.timerRunning = true;
    document.getElementById('startBtn').textContent = 'Pausar';
    
    timerInterval = setInterval(() => {
        state.timeRemaining--;
        updateTimerDisplay();
        
        if (state.timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    state.timerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('startBtn').textContent = 'Continuar';
}

function resetTimer() {
    clearInterval(timerInterval);
    state.timerRunning = false;
    const mode = getMode();
    state.timeRemaining = mode.work * 60;
    state.totalTime = mode.work * 60;
    state.isBreak = false;
    document.getElementById('startBtn').textContent = 'Iniciar';
    updateTimerDisplay();
}

function timerComplete() {
    state.timerRunning = false;
    try {
        if (alertAudio) { alertAudio.currentTime = 0; alertAudio.play(); }
        else { new Audio('assets/sound/alert.mp3').play(); }
    } catch (_) {}

    if (!state.isBreak) {
        state.sessionsToday++;
        state.totalMinutesToday += getMode().work;
        state.streak++;
        updateStats();

        // Show modal to link time to a task or skill
        showTimerCompleteModal(getMode().work);

        // Don't auto-start break - wait for user action
    } else {
        document.getElementById('breakOverlay').classList.remove('active');
        clearInterval(breakInterval);
        state.isBreak = false;
        const mode = getMode();
        state.timeRemaining = mode.work * 60;
        state.totalTime = mode.work * 60;
        document.getElementById('startBtn').textContent = 'Iniciar';
        updateTimerDisplay();
    }

    saveState();
}

function startBreak() {
    state.isBreak = true;
    const mode = getMode();
    state.timeRemaining = mode.break * 60;
    state.totalTime = mode.break * 60;

    document.getElementById('breakSuggestion').textContent =
        BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)];

    document.getElementById('breakOverlay').classList.add('active');
    updateTimerDisplay();

    breakInterval = setInterval(() => {
        const mins = Math.floor(state.timeRemaining / 60);
        const secs = state.timeRemaining % 60;
        document.getElementById('breakTimer').textContent =
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        state.timeRemaining--;
        updateTimerDisplay();

        if (state.timeRemaining <= 0) {
            clearInterval(breakInterval);
            timerComplete();
        }
    }, 1000);
}

function updateTaskListForDay(dayIndex) {
    const saved = localStorage.getItem(`maestro_schedule_${dayIndex}`);
    const taskSelect = document.getElementById('timerCompleteTask');

    if (!saved) {
        taskSelect.innerHTML = '<option value="">-- No hay tareas para este día --</option>';
        document.getElementById('taskDetailSelection').style.display = 'none';
        return;
    }

    const tasks = JSON.parse(saved);
    taskSelect.innerHTML = '<option value="">-- Seleccionar tarea --</option>' +
        tasks.map((task, index) => `<option value="${index}">${task.title}</option>`).join('');

    document.getElementById('taskDetailSelection').style.display = tasks.length > 0 ? 'block' : 'none';
}



function endBreak() {
    clearInterval(breakInterval);
    document.getElementById('breakOverlay').classList.remove('active');
    state.isBreak = false;
    const mode = getMode();
    state.timeRemaining = mode.work * 60;
    state.totalTime = mode.work * 60;
    document.getElementById('startBtn').textContent = 'Iniciar';
    updateTimerDisplay();
}

// Timer completion modal
function showTimerCompleteModal(minutesEarned) {
    const skillsOptions = state.skills.map(skill => `<option value="${skill.id}">${skill.name}</option>`).join('<option value="">-- Vincular a skill (opcional) --</option>');
    const daysOptions = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => `<option value="${index}">${day}</option>`).join('');

    const modalContent = `
        <div class="timer-complete-content">
            <h3>¡Sesión completada!</h3>
            <p>Has completado ${minutesEarned} minutos de estudio.</p>
            <p>¿Quieres vincular este tiempo a una tarea o skill para ganar XP?</p>

            <div class="form-group">
                <label for="linkType">Vincular a:</label>
                <select id="linkType" data-action="linkTypeChanged">
                    <option value="none">Nada (solo energía)</option>
                    <option value="skill">Skill</option>
                    <option value="task">Tarea de la agenda</option>
                </select>
            </div>

            <div id="skillSelector" class="form-group" style="display: none;">
                <label for="skillSelect">Seleccionar skill:</label>
                <select id="skillSelect"><option value="">-- Seleccionar skill --</option>
                    ${skillsOptions}
                </select>
            </div>

            <div id="taskSelector" class="form-group" style="display: none;">
                <label for="taskDay">Seleccionar día:</label>
                <select id="taskDay">${daysOptions}</select>
            </div>

            <div class="form-group">
                <button type="button" class="modal-btn modal-btn-primary" data-action="completeTimerWithLinking">Confirmar y otorgar XP</button>
                <button type="button" class="modal-btn modal-btn-secondary" data-action="completeTimerWithoutLinking">Solo energía</button>
            </div>
        </div>
    `;

    openModal(modalContent, 'Sesión Completada');
}

function linkTypeChanged() {
    const type = document.getElementById('linkType').value;
    document.getElementById('skillSelector').style.display = type === 'skill' ? 'block' : 'none';
    document.getElementById('taskSelector').style.display = type === 'task' ? 'block' : 'none';
}

function completeTimerWithLinking() {
    const linkType = document.getElementById('linkType').value;
    const mode = getMode();
    const minutesEarned = mode.work;

    if (linkType === 'skill') {
        const skillId = document.getElementById('skillSelect').value;
        if (skillId) {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                // For simplicity, we'll add a task to the skill representing this time block
                skill.tasks.push({
                    text: `Sesión de estudio: ${minutesEarned} minutos`,
                    done: true
                });

                // Recalculate progress
                const completed = skill.tasks.filter(t => t.done).length;
                skill.progress = skill.tasks.length > 0 ? Math.round((completed / skill.tasks.length) * 100) : 0;
                skill.status = skill.progress === 100 ? 'done' : skill.progress > 0 ? 'progress' : 'pending';

                // Add energy points (1 point per minute)
                state.energy = Math.min(5, state.energy + Math.floor(minutesEarned / 5));
                document.getElementById('energySlider').value = state.energy;
                document.getElementById('energyValue').textContent = state.energy;

                renderSkills();
                saveState();

                // Record session
                recordSession('skill', minutesEarned, skill.name, `Completed ${minutesEarned} minute timer session linked to skill`);

                showToast(`¡${skill.name} actualizada! +${Math.floor(minutesEarned / 5)} energía`, 'success');
            }
        }
    } else if (linkType === 'task') {
        const dayIndex = parseInt(document.getElementById('taskDay').value);
        const saved = localStorage.getItem(`maestro_schedule_${dayIndex}`);
        if (saved) {
            const tasks = JSON.parse(saved);
            // Add a new task for this time block
            tasks.push({
                title: `Sesión de estudio: ${minutesEarned} minutos`,
                skillName: 'Sesión de estudio',
                blocks: Math.ceil(minutesEarned / 5), // Assuming 5 min blocks
                completed: true
            });
            localStorage.setItem(`maestro_schedule_${dayIndex}`, JSON.stringify(tasks));
            renderSchedule();

            // Add energy points
            state.energy = Math.min(5, state.energy + Math.floor(minutesEarned / 5));
            document.getElementById('energySlider').value = state.energy;
            document.getElementById('energyValue').textContent = state.energy;

            saveState();

            // Record session
            recordSession('task', minutesEarned, 'Sesión de estudio', `Completed ${minutesEarned} minute timer session linked to task`);

            showToast(`¡Tarea completada! +${Math.floor(minutesEarned / 5)} energía`, 'success');
        }
    }

    // Start break after linking
    startBreak();
    closeModal();
}

function completeTimerWithoutLinking() {
    const mode = getMode();
    const minutesEarned = mode.work;

    // Add energy points (1 point per 5 minutes)
    const energyGained = Math.floor(minutesEarned / 5);
    state.energy = Math.min(5, state.energy + energyGained);
    document.getElementById('energySlider').value = state.energy;
    document.getElementById('energyValue').textContent = state.energy;

    saveState();

    // Record session
    recordSession('timer', minutesEarned, null, `Completed ${minutesEarned} minute timer session without linking`);

    showToast(`¡Sesión completada! +${energyGained} energía`, 'success');

    // Start break
    startBreak();
    closeModal();
}

function updateStats() {
    document.getElementById('sessionsCount').textContent = state.sessionsToday;
    document.getElementById('totalMinutes').textContent = state.totalMinutesToday;
    document.getElementById('streakCount').textContent = state.streak;
}

// Skills
function renderSkills() {
    const grid = document.getElementById('skillsGrid');
    const skillsContent = state.skills.length > 0 ? state.skills.map(skill => `
        <div class="skill-card">
            <div class="skill-header">
                <div>
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-type">${skill.type}</div>
                </div>
                <div class="skill-actions">
                    <select class="skill-status status-${skill.status}" data-action="updateStatus" data-args='["${skill.id}"]'>
                        <option value="pending" ${skill.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="progress" ${skill.status === 'progress' ? 'selected' : ''}>En progreso</option>
                        <option value="done" ${skill.status === 'done' ? 'selected' : ''}>Completado</option>
                        <option value="blocked" ${skill.status === 'blocked' ? 'selected' : ''}>Bloqueado</option>
                    </select>
                    <button class="timer-btn timer-btn-secondary" data-action="updateSkill" data-args='["${skill.id}"]' title="Editar habilidad">✏️</button>
                    <button class="timer-btn timer-btn-secondary" data-action="deleteSkill" data-args='["${skill.id}"]' title="Eliminar habilidad">🗑️</button>
                    <button class="timer-btn timer-btn-secondary" data-action="addSkillTask" data-args='["${skill.id}"]' title="Agregar tarea">➕</button>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${skill.progress}%"></div>
            </div>
            <div class="progress-text">${skill.progress}% completado</div>
            <div class="skill-tasks">
                ${skill.tasks.map((task, i) => `
                    <div class="task-item ${task.done ? 'completed' : ''}" style="display: flex; align-items: center; margin-top: 4px;">
                        <input type="checkbox" ${task.done ? 'checked' : ''} data-action="toggleTask" data-args='["${skill.id}", ${i}]' style="margin-right: 8px;">
                        <span style="flex-grow: 1;">${task.text}</span>
                        <button class="task-delete" data-action="deleteTaskFromSkill" data-args='["${skill.id}", ${i}]' data-stop="1">×</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('') : `
        <div class="empty-state">
            <h3>No tienes habilidades aún</h3>
            <p>Haz clic en "+ Nueva Skill" para crear tu primera habilidad de aprendizaje</p>
        </div>
    `;

    grid.innerHTML = `
        <div class="skills-header">
            <h2>Skills</h2>
            <button class="modal-btn modal-btn-primary" data-action="addSkill">+ Nueva Skill</button>
        </div>
        ${skillsContent}
    `;
}

function deleteTaskFromSkill(skillId, taskIndex, event) {
    if (event) event.stopPropagation();
    const skill = state.skills.find(s => s.id === skillId);
    if (!skill) return;

    if (!confirm('¿Eliminar esta tarea de la habilidad?')) return;

    skill.tasks.splice(taskIndex, 1);
    // Recalculate progress
    const completed = skill.tasks.filter(t => t.done).length;
    skill.progress = skill.tasks.length > 0 ? Math.round((completed / skill.tasks.length) * 100) : 0;
    skill.status = skill.progress === 100 ? 'done' : skill.progress > 0 ? 'progress' : 'pending';

    renderSkills();
    saveState();
    showToast('Tarea eliminada', 'info');
}

function updateStatus(skillId, newStatus) {
    const skill = state.skills.find(s => s.id === skillId);
    if (skill) { skill.status = newStatus; saveState(); }
}

function toggleTask(skillId, taskIndex) {
    const skill = state.skills.find(s => s.id === skillId);
    if (!skill) return;
    skill.tasks[taskIndex].done = !skill.tasks[taskIndex].done;
    const completed = skill.tasks.filter(t => t.done).length;
    skill.progress = Math.round((completed / skill.tasks.length) * 100);
    skill.status = skill.progress === 100 ? 'done' : skill.progress > 0 ? 'progress' : 'pending';
    renderSkills();
    saveState();
}

// Skill CRUD operations
function addSkill() {
    const modalContent = `
        <form id="skillForm">
            <div class="form-group">
                <label for="skillName">Nombre de la habilidad:</label>
                <input type="text" id="skillName" required>
            </div>
            <div class="form-group">
                <label for="skillType">Tipo de habilidad (ej: Game Dev, Data Engineering, Idioma):</label>
                <input type="text" id="skillType" required>
            </div>
            <div class="form-group">
                <button type="submit" class="modal-btn modal-btn-primary">Guardar</button>
                <button type="button" class="modal-btn modal-btn-secondary" data-action="closeModal">Cancelar</button>
            </div>
        </form>
    `;

    openModal(modalContent, 'Agregar Nueva Habilidad');

    const form = document.getElementById('skillForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        const skillName = document.getElementById('skillName').value.trim();
        const skillType = document.getElementById('skillType').value.trim();

        if (!skillName) {
            showToast('El nombre de la habilidad es requerido', 'error');
            return;
        }
        if (!skillType) {
            showToast('El tipo de habilidad es requerido', 'error');
            return;
        }

        const newSkill = {
            id: Date.now().toString(),
            name: skillName,
            type: skillType,
            status: 'pending',
            progress: 0,
            tasks: []
        };

        state.skills.push(newSkill);
        renderSkills();
        saveState();
        closeModal();
        showToast('Habilidad agregada', 'success');
    };
}

function updateSkill(skillId) {
    const skill = state.skills.find(s => s.id === skillId);
    if (!skill) return;

    const modalContent = `
        <form id="updateSkillForm">
            <div class="form-group">
                <label for="editSkillName">Nombre de la habilidad:</label>
                <input type="text" id="editSkillName" value="${skill.name}" required>
            </div>
            <div class="form-group">
                <label for="editSkillType">Tipo de habilidad:</label>
                <input type="text" id="editSkillType" value="${skill.type}" required>
            </div>
            <div class="form-group">
                <button type="submit" class="modal-btn modal-btn-primary">Guardar</button>
                <button type="button" class="modal-btn modal-btn-secondary" data-action="closeModal">Cancelar</button>
            </div>
        </form>
    `;

    openModal(modalContent, 'Editar Habilidad');

    const form = document.getElementById('updateSkillForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        const newName = document.getElementById('editSkillName').value.trim();
        const newType = document.getElementById('editSkillType').value.trim();

        if (!newName) {
            showToast('El nombre no puede estar vacío', 'error');
            return;
        }
        if (!newType) {
            showToast('El tipo no puede estar vacío', 'error');
            return;
        }

        skill.name = newName;
        skill.type = newType;
        renderSkills();
        saveState();
        closeModal();
        showToast('Habilidad actualizada', 'success');
    };
}

function deleteSkill(skillId) {
    const skill = state.skills.find(s => s.id === skillId);
    if (!skill) return;

    const modalContent = `
        <p>¿Estás seguro de que quieres eliminar la habilidad "<strong>${skill.name}</strong>"?</p>
        <p>Esta acción no se puede deshacer.</p>
        <div class="form-group">
            <button type="button" class="modal-btn modal-btn-danger" data-action="confirmDeleteSkill" data-args='["${skillId}"]'>Eliminar</button>
            <button type="button" class="modal-btn modal-btn-secondary" data-action="closeModal">Cancelar</button>
        </div>
    `;

    openModal(modalContent, 'Confirmar Eliminación');
}

function confirmDeleteSkill(skillId) {
    const skillIndex = state.skills.findIndex(s => s.id === skillId);
    if (skillIndex !== -1) {
        state.skills.splice(skillIndex, 1);
        renderSkills();
        saveState();
        closeModal();
        showToast('Habilidad eliminada', 'success');
    }
}

function addSkillTask(skillId) {
    const skill = state.skills.find(s => s.id === skillId);
    if (!skill) return;

    const modalContent = `
        <form id="skillTaskForm">
            <div class="form-group">
                <label for="taskDescription">Descripción de la tarea:</label>
                <input type="text" id="taskDescription" required>
            </div>
            <div class="form-group">
                <button type="submit" class="modal-btn modal-btn-primary">Guardar</button>
                <button type="button" class="modal-btn modal-btn-secondary" data-action="closeModal">Cancelar</button>
            </div>
        </form>
    `;

    openModal(modalContent, 'Agregar Tarea a Habilidad');

    const form = document.getElementById('skillTaskForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        const taskText = document.getElementById('taskDescription').value.trim();

        if (!taskText) {
            showToast('La descripción de la tarea es requerida', 'error');
            return;
        }

        skill.tasks.push({
            text: taskText,
            done: false
        });

        // Recalculate progress
        const completed = skill.tasks.filter(t => t.done).length;
        skill.progress = skill.tasks.length > 0 ? Math.round((completed / skill.tasks.length) * 100) : 0;
        skill.status = skill.progress === 100 ? 'done' : skill.progress > 0 ? 'progress' : 'pending';

        renderSkills();
        saveState();
        closeModal();
        showToast('Tarea agregada', 'success');
    };
}

// Schedule
function renderSchedule() {
    const columns = document.getElementById('scheduleColumns');
    const calendar = document.getElementById('scheduleCalendar');
    const isCal = state.calendarView === 'calendar';

    // Sync toolbar state
    document.querySelectorAll('.schedule-toggle button').forEach(b => {
        b.classList.toggle('active', b.dataset.view === state.calendarView);
    });

    columns.hidden = isCal;
    calendar.hidden = !isCal;

    if (isCal) { renderCalendarView(); return; }

    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1;

    columns.innerHTML = days.map((day, i) => {
        const tasks = getDayTasks(i);
        const hasTasks = tasks && tasks.trim() !== '';
        return `
            <div class="day-column">
                <div class="day-name ${i === todayIndex ? 'today' : ''}">${day}</div>
                ${hasTasks ? tasks : '<div class="empty-state">No hay tareas para este día<br>Haz clic en "+ Añadir" para crear una tarea</div>'}
                <button class="add-task-btn" data-action="openAddTaskModal" data-args='[${i}]'>+ Añadir</button>
            </div>
        `;
    }).join('');
}

// ---- Calendar view ----
function ymd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function monthLabel(date) {
    try {
        return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
    } catch { return date.toLocaleString(); }
}

function loadCalendarTasks(dateStr) {
    const saved = localStorage.getItem(`maestro_calendar_${dateStr}`);
    return saved ? JSON.parse(saved) : [];
}

function renderCalendarView() {
    const grid = document.getElementById('scheduleCalendar');
    const title = document.getElementById('calTitle');
    const cursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth(), 1);
    title.textContent = monthLabel(cursor);

    const today = new Date();
    const todayStr = ymd(today);

    // Monday-first weekday index for the 1st of the month
    const firstDow = (cursor.getDay() + 6) % 7; // 0=Mon..6=Sun
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

    const cells = [];
    // Leading days from previous month
    for (let i = 0; i < firstDow; i++) {
        const d = new Date(cursor.getFullYear(), cursor.getMonth(), -firstDow + i + 1);
        cells.push({ date: d, otherMonth: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), i), otherMonth: false });
    }
    // Trailing days to complete the 6-row grid (42 cells max)
    while (cells.length % 7 !== 0 || cells.length < 35) {
        const last = cells[cells.length - 1].date;
        const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
        cells.push({ date: next, otherMonth: true });
    }

    grid.innerHTML = cells.map(cell => {
        const dateStr = ymd(cell.date);
        const tasks = loadCalendarTasks(dateStr);
        const isToday = dateStr === todayStr;
        const dayNum = cell.date.getDate();
        const tasksHtml = tasks.map((t, idx) =>
            `<div class="calendar-task ${t.completed ? 'completed' : ''}"
                  data-action="toggleCalendarTask" data-args='["${dateStr}", ${idx}]' data-stop="1"
                  title="${(t.title || '').replace(/"/g, '&quot;')}">${t.title || ''}</div>`
        ).join('');
        const count = tasks.length;
        return `
            <div class="calendar-day ${cell.otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}"
                 data-date="${dateStr}" data-count="${count}"
                 data-action="openCalendarTaskModal" data-args='["${dateStr}"]'>
                <div class="calendar-day-num">${dayNum}</div>
                ${tasksHtml}
            </div>`;
    }).join('');
}

function switchCalendarView(view) {
    state.calendarView = view;
    renderSchedule();
}

function openCalendarTaskModal(dateStr) {
    // dateStr format YYYY-MM-DD; display as DD/MM/YYYY for humans
    const [, m, d] = dateStr.split('-');
    const dayLabel = `${d}/${m}`;
    const skillsOptions = '<option value="">-- Seleccionar skill --</option>' +
        state.skills.map(skill => `<option value="${skill.id}">${skill.name}</option>`).join('');

    const modalContent = `
        <form id="taskForm">
            <div class="form-group">
                <label for="taskTitle">Título del tema/materia:</label>
                <input type="text" id="taskTitle" required>
            </div>
            <div class="form-group">
                <label for="taskSkill">Skill asociada:</label>
                <select id="taskSkill">${skillsOptions}</select>
            </div>
            <div class="form-group">
                <label for="taskBlocks">Bloques de tiempo:</label>
                <input type="number" id="taskBlocks" min="1" value="1" required>
            </div>
            <div class="form-group">
                <button type="submit" class="modal-btn modal-btn-primary">Guardar</button>
                <button type="button" class="modal-btn modal-btn-secondary" data-action="closeModal">Cancelar</button>
            </div>
        </form>
    `;
    openModal(modalContent, `Añadir tarea para ${dayLabel}`);

    const form = document.getElementById('taskForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value.trim();
        const skillId = document.getElementById('taskSkill').value;
        const blocks = parseInt(document.getElementById('taskBlocks').value);
        if (!title) { showToast('El título es requerido', 'error'); return; }
        const skillName = skillId ? state.skills.find(s => s.id === skillId).name : '';
        saveCalendarTask(dateStr, { title, skillName, blocks, completed: false, createdAt: Date.now() });
        closeModal();
    };
}

function saveCalendarTask(dateStr, task) {
    const tasks = loadCalendarTasks(dateStr);
    tasks.push(task);
    localStorage.setItem(`maestro_calendar_${dateStr}`, JSON.stringify(tasks));
    renderSchedule();
    showToast('Tarea agregada', 'success');
}

function toggleCalendarTask(dateStr, idx) {
    const tasks = loadCalendarTasks(dateStr);
    const task = tasks[idx];
    if (!task) return;
    const wasCompleted = task.completed;
    task.completed = !wasCompleted;
    localStorage.setItem(`maestro_calendar_${dateStr}`, JSON.stringify(tasks));
    renderSchedule();

    if (task.completed && !wasCompleted) {
        const energyToAdd = task.blocks || 1;
        state.energy = Math.min(5, state.energy + energyToAdd);
        document.getElementById('energySlider').value = state.energy;
        document.getElementById('energyValue').textContent = state.energy;
        saveState();
        recordSession('task', (task.blocks || 1) * 5, task.skillName || 'Sin skill', `Completed calendar task: ${task.title}`);
        showToast(`¡Tarea completada! +${energyToAdd} energía`, 'success');
    } else {
        showToast('Tarea marcada como pendiente', 'info');
    }
}

function deleteCalendarTask(dateStr, idx) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    const tasks = loadCalendarTasks(dateStr);
    tasks.splice(idx, 1);
    localStorage.setItem(`maestro_calendar_${dateStr}`, JSON.stringify(tasks));
    renderSchedule();
    showToast('Tarea eliminada', 'info');
}

function getDayTasks(dayIndex) {
    const saved = localStorage.getItem(`maestro_schedule_${dayIndex}`);
    if (!saved) return '';
    const tasks = JSON.parse(saved);
    return tasks.map((t, index) => `<div class="schedule-item ${t.completed ? 'completed' : ''}" data-action="toggleTaskCompletion" data-args='[${dayIndex}, ${index}]'>
        <div class="schedule-item-content">
            <div class="schedule-item-title">${t.title}</div>
            <div class="schedule-item-details">
                <span class="schedule-item-skill">${t.skillName || 'Sin skill'}</span>
                <span class="schedule-item-blocks">${t.blocks} bloques</span>
            </div>
        </div>
        <button class="schedule-item-delete" data-action="deleteTask" data-args='[${dayIndex}, ${index}]' data-stop="1">×</button>
    </div>`).join('');
}

function openAddTaskModal(dayIndex) {
    const dayName = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][dayIndex];
    const skillsOptions = state.skills.map(skill => `<option value="${skill.id}">${skill.name}</option>`).join('<option value="">-- Seleccionar skill --</option>');

    const modalContent = `
        <form id="taskForm">
            <div class="form-group">
                <label for="taskTitle">Título del tema/materia:</label>
                <input type="text" id="taskTitle" required>
            </div>
            <div class="form-group">
                <label for="taskSkill">Skill asociada:</label>
                <select id="taskSkill"><option value="">-- Seleccionar skill --</option>
                    ${skillsOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="taskBlocks">Bloques de tiempo:</label>
                <input type="number" id="taskBlocks" min="1" value="1" required>
            </div>
            <div class="form-group">
                <button type="submit" class="modal-btn modal-btn-primary">Guardar</button>
                <button type="button" class="modal-btn modal-btn-secondary" data-action="closeModal">Cancelar</button>
            </div>
        </form>
    `;

    openModal(modalContent, `Añadir tarea para el ${dayName}`);

    // Handle form submission
    const form = document.getElementById('taskForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value.trim();
        const skillId = document.getElementById('taskSkill').value;
        const blocks = parseInt(document.getElementById('taskBlocks').value);

        if (!title) {
            showToast('El título es requerido', 'error');
            return;
        }

        const skillName = skillId ? state.skills.find(s => s.id === skillId).name : '';
        saveTask(dayIndex, { title, skillName, blocks });
        closeModal();
    };
}

function deleteTask(dayIndex, taskIndex, event) {
    if (event) event.stopPropagation();
    if (!confirm('¿Eliminar esta tarea?')) return;
    const saved = localStorage.getItem(`maestro_schedule_${dayIndex}`);
    if (!saved) return;
    const tasks = JSON.parse(saved);
    tasks.splice(taskIndex, 1);
    localStorage.setItem(`maestro_schedule_${dayIndex}`, JSON.stringify(tasks));
    renderSchedule();
    showToast('Tarea eliminada', 'info');
}

function toggleTaskCompletion(dayIndex, taskIndex) {
    const saved = localStorage.getItem(`maestro_schedule_${dayIndex}`);
    if (!saved) return;
    const tasks = JSON.parse(saved);
    const task = tasks[taskIndex];
    const wasCompleted = task.completed;
    task.completed = !wasCompleted;
    localStorage.setItem(`maestro_schedule_${dayIndex}`, JSON.stringify(tasks));
    renderSchedule();

    if (task.completed && !wasCompleted) {
        // Task was just completed, award energy
        const energyToAdd = task.blocks || 1; // default to 1 if blocks not set
        state.energy = Math.min(5, state.energy + energyToAdd);
        document.getElementById('energySlider').value = state.energy;
        document.getElementById('energyValue').textContent = state.energy;
        saveState();

        // Record session
        const skillName = task.skillName || 'Sin skill';
        recordSession('task', (task.blocks || 1) * 5, skillName, `Completed task: ${task.title}`);

        showToast(`¡Tarea completada! +${energyToAdd} energía`, 'success');
    } else if (!task.completed && wasCompleted) {
        // Task was just uncompleted, we could deduct energy? But requirements don't specify.
        // For simplicity, we don't deduct energy when uncompleted.
        showToast('Tarea marcada como pendiente', 'info');
    }
}

function saveTask(dayIndex, task) {
    const saved = localStorage.getItem(`maestro_schedule_${dayIndex}`);
    const tasks = saved ? JSON.parse(saved) : [];
    tasks.push(task);
    localStorage.setItem(`maestro_schedule_${dayIndex}`, JSON.stringify(tasks));
    renderSchedule();
    showToast('Tarea agregada', 'success');
}

// Chat
async function checkOllama() {
    try {
        const res = await fetch(`${state.settings.ollamaUrl}/api/tags`, { method: 'GET' });
        ollamaAvailable = res.ok;
    } catch { ollamaAvailable = false; }
    document.getElementById('ollamaStatus').className = `status-dot ${ollamaAvailable ? 'online' : 'offline'}`;
    document.getElementById('ollamaText').textContent = ollamaAvailable ? 'Ollama conectado' : 'Ollama no disponible';
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    
    addMessage(msg, 'user');
    input.value = '';
    
    if (!ollamaAvailable) {
        addMessage('Ollama no está corriendo. Verifica la URL en Configuración.', 'assistant');
        return;
    }
    
    document.getElementById('sendBtn').disabled = true;
    
    try {
        const model = state.settings.model === 'custom' 
            ? document.getElementById('customModel').value 
            : state.settings.model;
        
        const res = await fetch(`${state.settings.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                prompt: msg,
                system: state.settings.systemPrompt,
                stream: false,
                options: {
                    temperature: state.settings.temperature,
                    top_p: state.settings.topP,
                    num_predict: state.settings.maxTokens
                }
            })
        });
        
        const data = await res.json();
        addMessage(data.response, 'assistant');
    } catch (e) {
        addMessage('Error: ' + e.message, 'assistant');
    }
    
    document.getElementById('sendBtn').disabled = false;
}

function addMessage(text, role) {
    const container = document.getElementById('chatMessages');
    const wrap = document.createElement('div');
    wrap.className = `message ${role}`;
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🎓';
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;
    wrap.appendChild(avatar);
    wrap.appendChild(content);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
}

// Settings
function isAllowedOllamaUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || rawUrl.length === 0) return false;
    let u;
    try { u = new URL(rawUrl); } catch { return false; }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (!u.hostname || u.hostname === '0.0.0.0') return false;
    const h = u.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
}

function saveSettings() {
    const raw = document.getElementById('ollamaUrl').value.replace(/\/$/, '');
    if (!isAllowedOllamaUrl(raw)) {
        showSettingsStatus('URL no permitida. Usa localhost o 127.0.0.1', 'error');
        return;
    }
    state.settings.ollamaUrl = raw;
    state.settings.model = document.getElementById('modelSelect').value;
    state.settings.systemPrompt = document.getElementById('systemPrompt').value;
    state.settings.temperature = parseFloat(document.getElementById('temperature').value);
    state.settings.topP = parseFloat(document.getElementById('topP').value);
    state.settings.maxTokens = parseInt(document.getElementById('maxTokens').value);
    state.settings.devMode = document.getElementById('devModeToggle').checked;
    saveState();
    checkOllama();
    showSettingsStatus('Configuración guardada', 'success');
}

function loadSettings() {
    document.getElementById('ollamaUrl').value = state.settings.ollamaUrl;
    document.getElementById('modelSelect').value = state.settings.model;
    document.getElementById('systemPrompt').value = state.settings.systemPrompt;
    document.getElementById('temperature').value = state.settings.temperature;
    document.getElementById('tempValue').textContent = state.settings.temperature;
    document.getElementById('topP').value = state.settings.topP;
    document.getElementById('topPValue').textContent = state.settings.topP;
    document.getElementById('maxTokens').value = state.settings.maxTokens;
    document.getElementById('devModeToggle').checked = state.settings.devMode || false;

    if (!['qwen2.5-coder:3b', 'qwen2.5:3b', 'llama3.1:8b', 'gemma2:9b', 'mistral:7b'].includes(state.settings.model)) {
        document.getElementById('modelSelect').value = 'custom';
        document.getElementById('customModel').value = state.settings.model;
        document.getElementById('customModel').style.display = 'block';
    }

    // Initialize evaluation configurations
    initEvaluationConfigs();
}

async function testConnection() {
    const url = document.getElementById('ollamaUrl').value.replace(/\/$/, '');
    if (!isAllowedOllamaUrl(url)) {
        showSettingsStatus('URL no permitida. Usa localhost o 127.0.0.1', 'error');
        return;
    }
    try {
        const res = await fetch(`${url}/api/tags`);
        if (res.ok) {
            const data = await res.json();
            const models = data.models?.map(m => m.name).join(', ') || 'ninguno';
            showSettingsStatus(`Conexión OK. Modelos: ${models}`, 'success');
        } else {
            showSettingsStatus('Error: Ollama respondió con ' + res.status, 'error');
        }
    } catch (e) {
        showSettingsStatus('No se pudo conectar: ' + e.message, 'error');
    }
}

function showSettingsStatus(msg, type) {
    const el = document.getElementById('settingsStatus');
    el.style.display = 'block';
    el.style.background = type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    el.style.color = type === 'success' ? 'var(--success)' : 'var(--danger)';
    el.textContent = msg;
    setTimeout(() => el.style.display = 'none', 5000);
}

function applyPreset(presetName) {
    const presets = {
        preciso: { temperature: 0.1, topP: 0.1, maxTokens: 256 },
        equilibrado: { temperature: 0.3, topP: 0.5, maxTokens: 512 },
        detallado: { temperature: 0.2, topP: 0.3, maxTokens: 1024 },
        creativo: { temperature: 0.7, topP: 0.9, maxTokens: 768 }
    };

    const preset = presets[presetName];
    if (preset) {
        document.getElementById('temperature').value = preset.temperature;
        document.getElementById('tempValue').textContent = preset.temperature;
        document.getElementById('topP').value = preset.topP;
        document.getElementById('topPValue').textContent = preset.topP;
        document.getElementById('maxTokens').value = preset.maxTokens;
        saveSettings();
        showSettingsStatus(`Configuración ${presetName} aplicada`, 'success');
    }
}

// Persistence
function saveState() {
    localStorage.setItem('maestro_state', JSON.stringify({
        energy: state.energy,
        selectedMode: state.selectedMode,
        sessionsToday: state.sessionsToday,
        totalMinutesToday: state.totalMinutesToday,
        streak: state.streak,
        sessionHistory: state.sessionHistory,
        settings: state.settings,
        skills: state.skills
    }));
}

function recordSession(sessionType, minutes, linkedTo = null, details = null) {
    const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: sessionType, // 'timer', 'task', 'skill'
        minutes: minutes,
        linkedTo: linkedTo, // skill name or task title if applicable
        details: details, // additional info
        energyGained: Math.floor(minutes / 5) // 1 energy per 5 minutes
    };

    state.sessionHistory.push(session);

    // Keep only last 100 sessions to prevent storage issues
    if (state.sessionHistory.length > 100) {
        state.sessionHistory = state.sessionHistory.slice(-100);
    }

    saveState();
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem('maestro_state'));
        if (saved) {
            state.energy = saved.energy || 3;
            state.selectedMode = saved.selectedMode || 'regular';
            state.sessionsToday = saved.sessionsToday || 0;
            state.totalMinutesToday = saved.totalMinutesToday || 0;
            state.streak = saved.streak || 0;
            state.sessionHistory = saved.sessionHistory || [];
            state.settings = { ...state.settings, ...saved.settings };
            state.skills = saved.skills || state.skills;
            document.getElementById('energySlider').value = state.energy;
            document.getElementById('energyValue').textContent = state.energy;
        }
    } catch {}

    const mode = getMode();
    state.timeRemaining = mode.work * 60;
    state.totalTime = mode.work * 60;
}

// Init — trailing block was moved to initApp() and removed here.
// The auto-bootstrap at the bottom of this file wires initApp() once the
// document has finished parsing; in tests, callers invoke initApp() explicitly.

// Settings event listeners + initial paint block — moved to initApp()
// and removed here. The auto-bootstrap at the bottom of this file wires
// initApp() once the document finishes parsing; tests invoke initApp() directly.

// Toast function
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    // Remove toast after animation ends
    setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) {
            container.remove();
        }
    }, 3000);
}

// Modal functions
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function openModal(content, title = '') {
    // Remove any existing modal
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';

    const modalTitle = document.createElement('h2');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = title;

    const modalClose = document.createElement('button');
    modalClose.className = 'modal-close';
    modalClose.innerHTML = '&times;';
    modalClose.onclick = closeModal;

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(modalClose);

    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = content;

    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);
}

function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Evaluation system functions
function initEvaluationConfigs() {
    const evalConfigs = document.getElementById('evalConfigs');
    const presets = {
        preciso: { name: 'Preciso', temperature: 0.1, topP: 0.1, maxTokens: 256 },
        equilibrado: { name: 'Equilibrado', temperature: 0.3, topP: 0.5, maxTokens: 512 },
        detallado: { name: 'Detallado', temperature: 0.2, topP: 0.3, maxTokens: 1024 },
        creativo: { name: 'Creativo', temperature: 0.7, topP: 0.9, maxTokens: 768 }
    };

    evalConfigs.innerHTML = Object.entries(presets).map(([key, config]) => `
        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <input type="checkbox" value="${key}" checked>
            <span>${config.name}</span>
            <small style="margin-left: auto; font-size: 0.8rem; color: var(--text-muted);">
                temp=${config.temperature}, top_p=${config.topP}, tokens=${config.maxTokens}
            </small>
        </label>
    `).join('');
}

async function runEvaluation() {
    const prompt = document.getElementById('evalPrompt').value.trim();
    if (!prompt) {
        showSettingsStatus('Por favor ingrese un prompt para evaluar', 'error');
        return;
    }

    const evalConfigs = document.getElementById('evalConfigs');
    const selectedCheckboxes = Array.from(evalConfigs.querySelectorAll('input[type="checkbox"]:checked'));

    if (selectedCheckboxes.length === 0) {
        showSettingsStatus('Por favor seleccione al menos una configuración para comparar', 'error');
        return;
    }

    const resultsDiv = document.getElementById('evalResults');
    resultsDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Ejecutando evaluación...</div>';

    try {
        const presets = {
            preciso: { name: 'Preciso', temperature: 0.1, topP: 0.1, maxTokens: 256 },
            equilibrado: { name: 'Equilibrado', temperature: 0.3, topP: 0.5, maxTokens: 512 },
            detallado: { name: 'Detallado', temperature: 0.2, topP: 0.3, maxTokens: 1024 },
            creativo: { name: 'Creativo', temperature: 0.7, topP: 0.9, maxTokens: 768 }
        };

        const results = [];

        for (const checkbox of selectedCheckboxes) {
            const configKey = checkbox.value;
            const config = presets[configKey];

            const startTime = performance.now();

            const res = await fetch(`${state.settings.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: state.settings.model === 'custom'
                        ? document.getElementById('customModel').value
                        : state.settings.model,
                    prompt: prompt,
                    system: state.settings.systemPrompt,
                    stream: false,
                    options: {
                        temperature: config.temperature,
                        top_p: config.topP,
                        num_predict: config.maxTokens
                    }
                })
            });

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            if (res.ok) {
                const data = await res.json();
                results.push({
                    config: config,
                    response: data.response,
                    time: responseTime,
                    length: data.response.length
                });
            } else {
                results.push({
                    config: config,
                    error: `Error HTTP ${res.status}`,
                    time: responseTime,
                    length: 0
                });
            }
        }

        // Display results
        resultsDiv.innerHTML = `
            <div style="display: grid; gap: 16px;">
                ${results.map((result, index) => `
                    <div style="background: var(--surface); border-radius: 12px; padding: 16px; border-left: 4px solid var(--accent);">
                        <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: var(--text);">${result.config.name}</h4>
                            <div style="display: flex; gap: 12px; font-size: 0.9rem; color: var(--text-muted);">
                                <span>⏱️ ${result.time.toFixed(0)}ms</span>
                                <span>📝 ${result.length} caracteres</span>
                            </div>
                        </div>
                        <div data-result-text="${index}" class="result-text" style="line-height: 1.5; color: var(--text);"></div>
                    </div>
                `).join('')}
            </div>
        `;

        // Safe text injection AFTER innerHTML (defense-in-depth: ${result.response}/${result.error} never enter HTML parsing)
        results.forEach((result, i) => {
            const el = resultsDiv.querySelector(`[data-result-text="${i}"]`);
            if (el) {
                if (result.error) {
                    el.style.color = 'var(--danger)';
                    el.textContent = result.error;
                } else {
                    el.textContent = result.response;
                }
            }
        });

        showSettingsStatus('Evaluación completada', 'success');
    } catch (error) {
        resultsDiv.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--danger);">Error: ${error.message}</div>`;
        showSettingsStatus('Error durante la evaluación', 'error');
    }
}

function clearEvaluationResults() {
    document.getElementById('evalResults').innerHTML = '';
    showSettingsStatus('Resultados limpiados', 'success');
}


// ── Delegation handler: resolves data-action attributes CSP-safe (no inline scripts).
const _ACTION_FNS = {
  selectMode, completeTimerWithLinking, completeTimerWithoutLinking,
  updateSkill, deleteSkill, addSkillTask, deleteTaskFromSkill,
  addSkill, closeModal, confirmDeleteSkill, toggleTask, applyPreset, updateStatus,
  openAddTaskModal, toggleCalendarTask, openCalendarTaskModal,
  toggleTaskCompletion, deleteTask, saveCalendarTask, deleteCalendarTask,
  saveSettings, testConnection, runEvaluation, clearEvaluationResults, clearAllData,
  linkTypeChanged,
};
function _delegatedEvent(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  if (el.dataset.stop) e.stopPropagation();
  const fn = _ACTION_FNS[el.dataset.action];
  if (!fn) return;
  const raw = el.dataset.args;
  const args = raw ? JSON.parse(raw) : [];
  if (e.type === 'change' && el.tagName === 'SELECT') args.push(el.value);
  fn(...args);
}

// ── Bridge: copy every named function onto a window-like object so
// inline onclick="foo()" attributes in index.html resolve.
// NOTE: ESM module-scoped functions are NOT on globalThis, so we
// reference them directly via an object map rather than string lookups.
const BRIDGE_MAP = {
  ..._ACTION_FNS,
  getMode, renderModes, updateTimerDisplay,
  startTimer, pauseTimer, resetTimer, timerComplete,
  startBreak, showTimerCompleteModal, updateTaskListForDay,
  endBreak, completeTimerWithLinking,
  completeTimerWithoutLinking, updateStats,
  renderSkills, renderSchedule, ymd, monthLabel,
  loadCalendarTasks, renderCalendarView, switchCalendarView,
  checkOllama, sendMessage, addMessage,
  loadSettings, showSettingsStatus, applyPreset,
  saveState, recordSession, loadState,
  showToast, createToastContainer, openModal, closeModal,
  initEvaluationConfigs, preloadAlert,
};
function attachToWindow(win) {
  const w = win || (typeof window !== "undefined" ? window : null);
  if (!w) return;
  for (const [name, fn] of Object.entries(BRIDGE_MAP)) {
    if (typeof fn === "function") w[name] = fn;
  }
}

// ── initApp: re-bind DOM event listeners (mirrors the trailing block
// of the original inline script). Idempotent via __bound_ flags.
function initApp(win, doc) {
  const d = doc || (typeof document !== "undefined" ? document : null);
  if (!d) return;
  const $ = (id) => d.getElementById(id);
  const on = (el, ev, fn) => { if (el && !el["__bound_" + ev]) { el.addEventListener(ev, fn); el["__bound_" + ev] = true; } };

  // Tabs
  d.querySelectorAll(".tab").forEach(tab => on(tab, "click", () => {
    d.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    d.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    const panel = d.getElementById(tab.dataset.tab + "-panel");
    if (panel) panel.classList.add("active");
  }));

  on($("energySlider"),  "input", e => { state.energy = parseInt(e.target.value, 10); const v = $("energyValue"); if (v) v.textContent = state.energy; saveState(); });
  on($("startBtn"),      "click", startTimer);
  on($("resetBtn"),      "click", resetTimer);
  on($("endBreakBtn"),   "click", endBreak);
  on($("sendBtn"),       "click", sendMessage);
  on($("chatInput"),     "keypress", e => { if (e.key === "Enter") sendMessage(); });
  on($("modelSelect"),   "change", e => { const c = $("customModel"); if (c) c.style.display = e.target.value === "custom" ? "block" : "none"; });
  on($("temperature"),   "input",  e => { const v = $("tempValue"); if (v) v.textContent = e.target.value; });
  on($("topP"),          "input",  e => { const v = $("topPValue");  if (v) v.textContent = e.target.value; });
  on($("devModeToggle"), "change", e => { const s = $("devModeSection"); if (s) s.style.display = e.target.checked ? "block" : "none"; const l = $("devModeToggleLabel"); if (l) l.textContent = e.target.checked ? "Desactivar modo de prueba para desarrolladores" : "Activar modo de prueba para desarrolladores"; state.settings.devMode = e.target.checked; saveState(); });
  // Delegate all [data-action] events (CSP-safe replacement for inline onclick/onchange)
  d.addEventListener('click', _delegatedEvent);
  d.addEventListener('change', _delegatedEvent);

  // Initial paint — only when running in the actual document so tests can skip.
  if (typeof window !== "undefined" && d === window.document) {
    loadState();
    renderModes();
    renderSkills();
    renderSchedule();
    d.querySelectorAll(".schedule-toggle button").forEach(b => { b.addEventListener('click', () => switchCalendarView(b.dataset.view)); });
    const prev = $("calPrev"); if (prev) prev.addEventListener('click', () => { state.calendarCursor.setMonth(state.calendarCursor.getMonth() - 1); renderCalendarView(); });
    const next = $("calNext"); if (next) next.addEventListener('click', () => { state.calendarCursor.setMonth(state.calendarCursor.getMonth() + 1); renderCalendarView(); });
    updateTimerDisplay();
    updateStats();
    loadSettings();
    checkOllama();
    preloadAlert();
    setInterval(checkOllama, 30000);
    if (typeof location !== "undefined" && location.protocol === "file:") {
      const s = $("statusUrl"); if (s) s.textContent = "Abre via http://localhost:8081 para que Ollama funcione";
    }
  }
}

function clearAllData() {
  if (typeof localStorage !== 'undefined') localStorage.clear();
  const fresh = JSON.parse(JSON.stringify(INITIAL_STATE));
  fresh.calendarCursor = new Date();
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, fresh);
  saveState();
  showToast('Datos borrados. Recargando…', 'success');
  setTimeout(() => { if (typeof location !== 'undefined') location.reload(); }, 800);
}

// ── Auto-bootstrap when loaded via <script type="module">.
//
// In production this picks up the live Electron DOM and runs initApp() once
// the document is parsed. In tests we skip — the test invokes the individual
// functions it needs. The trigger condition: the original index.html has
// dozens of #ids; jsdom starts empty, so we use the presence of a known root
// id as a "this is the real document" signal.
if (typeof window !== "undefined" && typeof document !== "undefined") {
  attachToWindow(window);
  // isRealDoc: only auto-init in a fully populated document (Electron / browser).
  // jsdom test fixtures start with a near-empty body, so tests must opt-in
  // by populating the DOM AND calling initApp() explicitly when they want it.
  // Count all elements (not just body.children) — the real app nests content
  // inside <main>, <header>, etc., so direct children of <body> is too few.
  const isRealDoc = document.querySelectorAll('*').length > 50
                  && !!document.querySelector('.tab');
  if (isRealDoc) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initApp(window, document), { once: true });
    } else {
      initApp(window, document);
    }
  }
}

// ── Named exports for Jest tests.
export {
  MODES, BREAK_ACTIVITIES, state,
  attachToWindow, initApp,
};
// Re-export every named function so tests can import any of them directly.
// (Module-level `function` declarations do NOT auto-bind to global scope under
//  ESM; this is the canonical workaround.)
export {
  getMode, selectMode, renderModes, updateTimerDisplay,
  startTimer, pauseTimer, resetTimer, timerComplete,
  startBreak, showTimerCompleteModal, updateTaskListForDay,
  endBreak, completeTimerWithLinking,
  completeTimerWithoutLinking, updateStats,
  renderSkills, deleteTaskFromSkill, updateStatus, toggleTask,
  addSkill, updateSkill, deleteSkill, confirmDeleteSkill, addSkillTask,
  renderSchedule, ymd, monthLabel, loadCalendarTasks, renderCalendarView,
  switchCalendarView, openCalendarTaskModal, saveCalendarTask,
  toggleCalendarTask, deleteCalendarTask, getDayTasks, openAddTaskModal,
  deleteTask, toggleTaskCompletion, saveTask,
  checkOllama, sendMessage, addMessage,
  saveSettings, loadSettings, showSettingsStatus, applyPreset, isAllowedOllamaUrl, clearAllData,
  saveState, recordSession, loadState,
  showToast, createToastContainer, openModal, closeModal,
  initEvaluationConfigs, runEvaluation, clearEvaluationResults, testConnection,
  linkTypeChanged,
};
