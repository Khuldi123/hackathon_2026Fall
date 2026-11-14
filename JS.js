// CAREBEYOND
// Frontend hackathon prototype.
// Use fictional patient information only.

const pages = [
    ["⌂", "Overview"],
    ["▦", "Recovery Calendar"],
    ["✧", "AI Assistant"],
    ["◷", "Medications"],
    ["♡", "Health Check-in"],
    ["▤", "Recovery Timeline"],
    ["✎", "My Journal"],
    ["🥗", "Nutrition & Hydration"],
    ["↗", "Rehabilitation"],
    ["⚠", "Allergies & Reactions"],
    ["✚", "Safety Center"],
    ["▥", "Health Monitoring"],
    ["♧", "Care Team"],
    ["♙", "Caregiver Support"],
    ["▣", "My Device"],
    ["◎", "Patient Profile"]
];

const $ = id => document.getElementById(id);

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// PATIENT INFORMATION

const defaults = {
    profile: {
        name: "Joe",
        age: 62,
        weight: 180,
        surgery: "Open-heart surgery",
        date: ""
    },

    goals: [
        { name: "Review discharge instructions", done: false },
        { name: "Follow approved activity plan", done: false },
        { name: "Complete daily health check-in", done: false }
    ],

    medications: [],
    journal: [],
    checkins: [],
    allergies: [],
    exercises: [],
    messages: [],
    readings: [],
    chat: [],
    water: 0,
    waterGoal: 0,
    device: "HEART",
    caregiverRequests: 0,
    shareProgress: false,
    appointment: "",
    refill: "",
    day: new Date().toDateString()
};

let state;

try {
    state = {
        ...defaults,
        ...JSON.parse(localStorage.getItem("carebeyond-v3") || "{}")
    };
} catch {
    state = structuredClone(defaults);
}

let currentPage = "Overview";

function save() {
    localStorage.setItem(
        "carebeyond-v3",
        JSON.stringify(state)
    );
}

// RESET DAILY TRACKERS

function resetDaily() {
    const today = new Date().toDateString();

    if (state.day !== today) {
        state.day = today;
        state.water = 0;

        state.goals.forEach(goal => goal.done = false);

        state.medications.forEach(med => {
            med.taken = false;
        });

        state.exercises.forEach(exercise => {
            exercise.done = 0;
        });

        save();
    }
}

resetDaily();

// RECOVERY CALCULATIONS

function daysSinceSurgery() {
    if (!state.profile.date) return "—";

    const surgery = new Date(
        state.profile.date + "T00:00:00"
    );

    const today = new Date();

    const difference = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    ) - Date.UTC(
        surgery.getFullYear(),
        surgery.getMonth(),
        surgery.getDate()
    );

    return Math.max(
        0,
        Math.floor(difference / 86400000)
    );
}

function progress(value, total) {
    const percent = total > 0
        ? Math.min(100, value / total * 100)
        : 0;

    return `
        <div class="progress">
            <span style="width:${percent}%"></span>
        </div>
    `;
}

function notify(message) {
    $("notification").textContent = message;
    $("notification").hidden = false;
}

// LED MATRIX PATTERNS

const patterns = {
    HEART: [
        "00000000",
        "01100110",
        "11111111",
        "11111111",
        "01111110",
        "00111100",
        "00011000",
        "00000000"
    ],

    MED: [
        "00111100",
        "01000010",
        "10010001",
        "10010001",
        "10011101",
        "10000001",
        "01000010",
        "00111100"
    ],

    DONE: [
        "00000000",
        "00000001",
        "00000010",
        "10000100",
        "01001000",
        "00110000",
        "00000000",
        "00000000"
    ],

    ALERT: [
        "00011000",
        "00011000",
        "00011000",
        "00011000",
        "00011000",
        "00000000",
        "00011000",
        "00011000"
    ],

    WATER: [
        "00011000",
        "00011000",
        "00111100",
        "00111100",
        "01111110",
        "01111110",
        "00111100",
        "00000000"
    ]
};

function setDevice(command) {
    if (!patterns[command]) return;

    state.device = command;
    save();

    // Future ESP32 integration:
    // Send command to your backend here.
}

function matrix() {
    return `
        <div class="matrix">
            ${patterns[state.device]
                .join("")
                .split("")
                .map(pixel => `
                    <div class="dot
                        ${pixel === "1" ? "on" : ""}">
                    </div>
                `).join("")}
        </div>
    `;
}

function deviceCard() {
    return `
        <section class="card">
            <span class="pill">SMART COMPANION</span>
            <h2>CareBeyond Device</h2>

            <div class="row">
                ${matrix()}

                <div>
                    <h3>${state.device}</h3>
                    <p class="muted">
                        ESP32 · LED Matrix
                    </p>

                    <button class="secondary"
                        data-page="My Device">
                        Manage device
                    </button>
                </div>
            </div>

            <p class="muted">
                Simulated device — not connected.
            </p>
        </section>
    `;
}

// DAILY GOALS

function goalList() {
    return state.goals.map((goal, index) => `
        <label class="task">
            <input type="checkbox"
                data-goal="${index}"
                ${goal.done ? "checked" : ""}>

            ${escapeHTML(goal.name)}
        </label>
    `).join("");
}

// JOURNAL FORM

function journalForm() {
    return `
        <section class="card">
            <h2>How are you feeling today?</h2>

            <form id="journalForm">

                <label>Your mood</label>

                <select id="mood">
                    <option>😊 Great</option>
                    <option>🙂 Good</option>
                    <option>😐 Okay</option>
                    <option>😟 Poor</option>
                </select>

                <label>Personal reflection</label>

                <textarea id="journalNote" required
                    placeholder="Write about your feelings,
                    concerns or accomplishments...">
                </textarea>

                <button>Save reflection</button>

            </form>

            <p class="muted">
                Journal entries are not monitored
                for emergencies.
            </p>
        </section>
    `;
}

// RENDER WEBSITE

function render() {

    $("page-title").textContent = currentPage;

    $("navigation").innerHTML = pages.map(page => `
        <button data-page="${page[1]}"
            class="${currentPage === page[1]
                ? "active" : ""}">

            <span>${page[0]}</span>
            ${page[1]}

        </button>
    `).join("");

    let html = "";

    const completed = state.goals.filter(
        goal => goal.done
    ).length;

    const taken = state.medications.filter(
        med => med.taken
    ).length;

    // OVERVIEW DASHBOARD

    if (currentPage === "Overview") {

        html = `
            <section class="card hero">

                <small>YOUR RECOVERY JOURNEY</small>

                <h2>
                    Welcome home,
                    ${escapeHTML(state.profile.name)}.
                </h2>

                <p>
                    Your story continues here.
                    Every small step matters.
                </p>

                <h3>
                    Day ${daysSinceSurgery()}
                    since surgery
                </h3>

                ${progress(completed, state.goals.length)}

                <p>
                    ${completed} of
                    ${state.goals.length}
                    daily goals completed
                </p>

                <button class="secondary"
                    data-page="Recovery Timeline">
                    Explore your journey →
                </button>

            </section>

            <div class="stats">

                <section class="card">
                    <small>DAILY GOALS</small>
                    <div class="stat">
                        ${completed}/${state.goals.length}
                    </div>
                    <small>Completed today</small>
                </section>

                <section class="card">
                    <small>HYDRATION</small>
                    <div class="stat">
                        ${state.water} mL
                    </div>
                    <small>Logged today</small>
                </section>

                <section class="card">
                    <small>MEDICATION</small>
                    <div class="stat">
                        ${taken}/${state.medications.length}
                    </div>
                    <small>Logged today</small>
                </section>

            </div>

            <div class="grid">

                <section class="card">
                    <h2>Today's recovery plan</h2>

                    ${goalList()}

                    <br>

                    <button class="secondary"
                        data-page="Recovery Timeline">
                        Manage goals
                    </button>
                </section>

                
<section class="card patient-story">

    <div class="patient-header">

        <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces"
            alt="Illustrative patient portrait"
            class="patient-photo"
        >

        <div>
            <h2>Meet ${escapeHTML(state.profile.name)}</h2>
            <p>Your recovery story</p>
        </div>

    </div>

    <p class="patient-description">

        ${escapeHTML(state.profile.name)} is
        ${escapeHTML(state.profile.age)} years old
        and recovering from
        ${escapeHTML(state.profile.surgery)}.
        CareBeyond supports
        ${escapeHTML(state.profile.name)}
        throughout the recovery journey.

    </p>

    <div class="patient-details">

        <div class="patient-detail">
            <span>Age</span>
            <strong>
                ${escapeHTML(state.profile.age)} years
            </strong>
        </div>

        <div class="patient-detail">
            <span>Weight</span>
            <strong>
                ${escapeHTML(state.profile.weight)} lbs
            </strong>
        </div>

    </div>

    <button class="secondary patient-profile-button"
        data-page="Patient Profile">

        View patient profile →

    </button>

</section>


                    <h2>
                        Meet ${escapeHTML(state.profile.name)}
                    </h2>

                    <p>
                        ${escapeHTML(state.profile.name)}
                        is ${escapeHTML(state.profile.age)}
                        years old and is recovering from
                        ${escapeHTML(state.profile.surgery)}.
                    </p>

                    <p>
                        CareBeyond helps organize the
                        next chapter of recovery.
                    </p>

                    <button class="secondary"
                        data-page="Patient Profile">
                        Edit patient profile
                    </button>
                </section>

                

            </div>

            <section class="card">

                <span class="pill">AI RECOVERY SUPPORT</span>

                <h2>Have a recovery question?</h2>

                <p>
                    Explore your recovery instructions
                    and prepare questions for your care team.
                </p>

                <button data-page="AI Assistant">
                    Ask CareBeyond AI →
                </button>

            </section>
        `;
    }

    // PERSONALIZED PATIENT PROFILE

    if (currentPage === "Patient Profile") {

        html = `
            <section class="card">

                <h2>Make CareBeyond yours</h2>

                <form id="profileForm">

                    <label>Patient name</label>
                    <input id="patientName" required
                        value="${escapeHTML(state.profile.name)}">

                    <label>Age</label>
                    <input id="age" type="number"
                        min="1" max="120" required
                        value="${escapeHTML(state.profile.age)}">

                    <label>Weight (lbs)</label>
                    <input id="weight" type="number"
                        min="1" required
                        value="${escapeHTML(state.profile.weight)}">

                    <label>Type of surgery</label>
                    <input id="surgeryType" required
                        value="${escapeHTML(state.profile.surgery)}">

                    <label>Surgery date</label>
                    <input id="surgeryDate" type="date"
                        required
                        value="${escapeHTML(state.profile.date)}">

                    <button>Save patient profile</button>

                </form>

            </section>
        `;
    }

    // PERSONALIZED RECOVERY TIMELINE

    if (currentPage === "Recovery Timeline") {

        html = `
            <section class="card hero">
                <small>PERSONALIZED RECOVERY</small>

                <h2>Day ${daysSinceSurgery()}</h2>

                <p>Every milestone is meaningful.</p>

                ${progress(completed, state.goals.length)}

                ${completed} of ${state.goals.length}
                daily goals completed
            </section>

            <section class="card">

                <h2>Your recovery milestones</h2>

                <div class="timeline">

                    <div class="milestone">
                        <h3>Surgery</h3>
                        <p>
                            ${escapeHTML(
                                state.profile.date || "Date not set"
                            )}
                        </p>
                    </div>

                    <div class="milestone">
                        <h3>Early recovery</h3>
                        <p>
                            Follow your personalized
                            discharge instructions.
                        </p>
                    </div>

                    <div class="milestone">
                        <h3>Follow-up appointment</h3>
                        <p>
                            ${escapeHTML(
                                state.appointment || "Not scheduled"
                            )}
                        </p>
                    </div>

                    <div class="milestone">
                        <h3>Rehabilitation</h3>
                        <p>
                            Begin or progress activities
                            when approved by your care team.
                        </p>
                    </div>

                </div>

            </section>

            <section class="card">

                <h2>Personalized discharge checklist</h2>

                ${goalList()}

                <form id="goalForm">

                    <label>Add a care-team-approved goal</label>

                    <input id="newGoal" required
                        placeholder="Enter a recovery goal">

                    <button>Add goal</button>

                </form>

            </section>
        `;
    }

    // MEDICATION MANAGEMENT

    if (currentPage === "Medications") {

        html = `
            <section class="card">

                <h2>Your medication schedule</h2>

                <p>
                    Record medications already prescribed
                    by your healthcare provider.
                </p>

                <form id="medicationForm">

                    <label>Medication name</label>
                    <input id="medName" required>

                    <label>Prescribed dosage</label>
                    <input id="medDose" required>

                    <label>Reminder time</label>
                    <input id="medTime" type="time" required>

                    <button>Add medication</button>

                </form>

            </section>

            <section class="card">

                <h2>Today's medications</h2>

                ${state.medications.map((med, index) => `
                    <div class="entry">

                        <h3>${escapeHTML(med.name)}</h3>

                        <p>
                            ${escapeHTML(med.dose)}
                            · ${escapeHTML(med.time)}
                        </p>

                        <p>
                            ${allergyMatch(med.name)
                                ? "Reported allergy match. Contact your pharmacist."
                                : "No exact-name allergy match. Safety not established."}
                        </p>

                        <button data-med="${index}"
                            class="secondary"
                            ${med.taken ? "disabled" : ""}>

                            ${med.taken
                                ? "✓ Logged"
                                : "Log medication taken"}

                        </button>

                    </div>
                `).join("") || "<p>No medications added.</p>"}

                ${progress(taken, state.medications.length)}

                <button id="testReminder">
                    Test device reminder
                </button>

            </section>

            <section class="card">

                <h2>Refill reminder</h2>

                <form id="refillForm">

                    <label>Refill date</label>

                    <input id="refillDate" type="date"
                        required
                        value="${escapeHTML(state.refill)}">

                    <button>Save refill date</button>

                </form>

                <p class="muted">
                    Demo reminders require the website
                    to remain open.
                </p>

            </section>
        `;
    }

    // NUTRITION AND HYDRATION

    if (currentPage === "Nutrition & Hydration") {

        html = `
            <section class="card hero">

                <small>FUEL YOUR RECOVERY</small>

                <h2>Nourish your next chapter.</h2>

                <p>
                    Explore nutrition and hydration
                    based on your approved recovery plan.
                </p>

            </section>

            <div class="grid">

                <section class="card">

                    <h2>💧 Daily hydration</h2>

                    <div class="water-number">
                        ${state.water} mL
                    </div>

                    <p>
                        Care-team target:
                        ${state.waterGoal
                            ? state.waterGoal + " mL"
                            : "Not set"}
                    </p>

                    ${progress(state.water, state.waterGoal)}

                    <form id="waterForm">

                        <label>Amount consumed (mL)</label>

                        <input id="waterAmount"
                            type="number" min="1" required>

                        <button>Log fluid intake</button>

                    </form>

                    <br>

                    <form id="waterGoalForm">

                        <label>
                            Clinician-approved fluid target
                        </label>

                        <input id="waterTarget"
                            type="number" min="1" required>

                        <button class="secondary">
                            Save target
                        </button>

                    </form>

                    <p class="muted">
                        Follow your prescribed fluid limits.
                        This tracker does not determine
                        how much you should drink.
                    </p>

                </section>

                <section class="card">

                    <h2>Nutrition after heart surgery</h2>

                    <div class="nutrition-grid">

                        <div class="food-card">
                            <span>🥦</span>
                            <h3>Vegetables & fruit</h3>
                            <p>
                                Explore fiber-rich foods
                                appropriate for your diet.
                            </p>
                        </div>

                        <div class="food-card">
                            <span>🌾</span>
                            <h3>Whole grains</h3>
                            <p>
                                Consider suitable whole-grain
                                options such as oats.
                            </p>
                        </div>

                        <div class="food-card">
                            <span>🐟</span>
                            <h3>Protein</h3>
                            <p>
                                Ask about protein sources
                                that support your recovery.
                            </p>
                        </div>

                        <div class="food-card">
                            <span>🧂</span>
                            <h3>Sodium & fluids</h3>
                            <p>
                                Follow your prescribed sodium
                                and fluid restrictions.
                            </p>
                        </div>

                    </div>

                    <p>
                        Review food allergies and possible
                        food-medication interactions with
                        your care team.
                    </p>

                </section>

            </div>
        `;
    }

    // PHYSICAL AND SPEECH REHABILITATION

    if (currentPage === "Rehabilitation") {

        html = `
            <section class="card">

                <h2>Build your recovery routine</h2>

                <p>
                    Add activities approved by your care team,
                    such as walking, speech therapy or
                    prescribed physical exercises.
                </p>

                <form id="exerciseForm">

                    <label>Approved activity</label>

                    <input id="exerciseName" required
                        placeholder="Example: walking session">

                    <label>Daily sessions or repetitions</label>

                    <input id="exerciseTarget"
                        type="number" min="1" required>

                    <button>Add activity</button>

                </form>

                <p class="muted">
                    Do not begin lifting or new exercises
                    without medical clearance.
                </p>

            </section>

            <section class="card">

                <h2>Your rehabilitation goals</h2>

                ${state.exercises.map((exercise, index) => `
                    <div class="entry">

                        <h3>
                            ${escapeHTML(exercise.name)}
                        </h3>

                        ${exercise.done} of
                        ${exercise.target} completed

                        ${progress(
                            exercise.done,
                            exercise.target
                        )}

                        <button data-exercise="${index}"
                            ${exercise.done >= exercise.target
                                ? "disabled" : ""}>
                            + Log session
                        </button>

                    </div>
                `).join("") || "<p>No activities added.</p>"}

            </section>
        `;
    }

    // DAILY HEALTH CHECK-IN

    if (currentPage === "Health Check-in") {

        html = `
            <section class="card">

                <h2>Daily health check-in</h2>

                <form id="checkinForm">

                    <label>Pain level (0–10)</label>

                    <input id="pain" type="number"
                        min="0" max="10" required>

                    <label>How are you feeling?</label>

                    <select id="symptom">
                        <option>No new symptoms</option>
                        <option>Fatigue</option>
                        <option>New dizziness</option>
                        <option>Worsening symptoms</option>
                        <option>New or worsening chest pain</option>
                        <option>Severe difficulty breathing</option>
                        <option>Fainting</option>
                        <option>Severe allergic reaction</option>
                        <option>Stroke signs</option>
                    </select>

                    <label>Activity today</label>

                    <input id="activity"
                        placeholder="Describe today's activity">

                    <label>Additional notes</label>

                    <textarea id="healthNote"></textarea>

                    <button>Submit health check-in</button>

                </form>

            </section>

            <section class="card">

                <h2>Check-in history</h2>

                ${state.checkins.map(check => `
                    <div class="entry">
                        <small>${escapeHTML(check.date)}</small>
                        <h3>${escapeHTML(check.symptom)}</h3>
                        <p>Pain: ${check.pain}/10</p>
                        <p>${escapeHTML(check.note)}</p>
                    </div>
                `).join("") || "<p>No check-ins yet.</p>"}

            </section>
        `;
    }

    // PERSONAL RECOVERY JOURNAL

    if (currentPage === "My Journal") {

        html = journalForm() + `
            <section class="card">

                <h2>Your recovery reflections</h2>

                ${state.journal.map(entry => `
                    <div class="entry">

                        <small>${escapeHTML(entry.date)}</small>

                        <h3>${escapeHTML(entry.mood)}</h3>

                        <p>${escapeHTML(entry.note)}</p>

                    </div>
                `).join("") || "<p>No journal entries yet.</p>"}

            </section>
        `;
    }

    // ALLERGIES AND REACTIONS

    if (currentPage === "Allergies & Reactions") {

        html = `
            <section class="card">

                <h2>Your allergy profile</h2>

                <form id="allergyForm">

                    <label>Medication, food or substance</label>

                    <input id="allergen" required>

                    <label>Reaction experienced</label>

                    <textarea id="reaction" required
                        placeholder="Describe the reaction">
                    </textarea>

                    <button>Save allergy</button>

                </form>

            </section>

            <section class="card">

                <h2>Recorded allergies</h2>

                ${state.allergies.map(allergy => `
                    <div class="entry">
                        <h3>${escapeHTML(allergy.name)}</h3>
                        <p>${escapeHTML(allergy.reaction)}</p>
                    </div>
                `).join("") || "<p>No allergies recorded.</p>"}

            </section>

            <section class="card">

                <h2>Medication safety review</h2>

                ${state.medications.map(med => `
                    <div class="entry">
                        <h3>${escapeHTML(med.name)}</h3>

                        <p>
                            ${allergyMatch(med.name)
                                ? "⚠ Reported allergy match. Contact your pharmacist."
                                : "No exact-name match. Safety not established."}
                        </p>
                    </div>
                `).join("") || "<p>Add prescribed medications first.</p>"}

                <p class="muted">
                    This is an exact-name screening demo,
                    not a complete medical interaction check.
                </p>

            </section>
        `;
    }

    // SAFETY AND EMERGENCY GUIDANCE

    if (currentPage === "Safety Center") {

        html = `
            <section class="card">

                <h2>Know when to get help</h2>

                <div class="level">

                    <h3>Level 1 — Routine</h3>

                    <p>
                        Record stable recovery concerns
                        and discuss them with your care team.
                    </p>

                </div>

                <div class="level urgent">

                    <h3>Level 2 — Attention needed</h3>

                    <p>
                        Contact your care team promptly
                        for new dizziness, worsening
                        symptoms, fever or wound changes.
                    </p>

                </div>

                <div class="level emergency">

                    <h3>Level 3 — Emergency</h3>

                    <p>
                        New or worsening chest pain,
                        severe difficulty breathing,
                        fainting, stroke signs or severe
                        allergic reactions may be emergencies.
                    </p>

                    <strong>
                        Call 911 in the US.
                        Do not wait for the application.
                    </strong>

                </div>

                <p class="muted">
                    A low pain score does not rule out
                    an emergency.
                </p>

                <button data-page="Health Check-in">
                    Record symptoms
                </button>

            </section>
        `;
    }

    // AI RECOVERY ASSISTANT

    if (currentPage === "AI Assistant") {

        html = `
            <section class="card">

                <span class="pill">CAREBEYOND AI</span>

                <h2>Your recovery assistant</h2>

                <div class="entry">

                    Hello, ${escapeHTML(state.profile.name)}!

                    I can help you organize questions about
                    your recovery, medications, nutrition
                    and discharge instructions.

                </div>

                ${state.chat.map(message => `
                    <div class="entry">
                        ${escapeHTML(message)}
                    </div>
                `).join("")}

                <form id="chatForm">

                    <input id="question" required
                        placeholder="Ask about your recovery...">

                    <button>Send message</button>

                </form>

                <p class="muted">
                    Demo assistant. AI backend not connected.
                    Does not prescribe medication.
                </p>

            </section>
        `;
    }

    // HEALTH MONITORING — NO HEART RATE

    if (currentPage === "Health Monitoring") {

        html = `
            <section class="card">

                <h2>Health and activity tracking</h2>

                <p>
                    Manually record readings from
                    approved monitoring equipment.
                </p>

                <form id="monitorForm">

                    <label>Blood pressure</label>

                    <input id="bloodPressure"
                        placeholder="Example: 120/80">

                    <label>Oxygen saturation (%)</label>

                    <input id="oxygen" type="number"
                        min="0" max="100">

                    <label>Daily steps</label>

                    <input id="steps" type="number" min="0">

                    <button>Save readings</button>

                </form>

            </section>

            <section class="card">

                <h2>Health history</h2>

                ${state.readings.map(reading => `
                    <div class="entry">

                        <small>${escapeHTML(reading.date)}</small>

                        <p>
                            Blood pressure:
                            ${escapeHTML(reading.bp || "Not entered")}
                        </p>

                        <p>
                            Oxygen:
                            ${escapeHTML(reading.oxygen || "Not entered")}
                        </p>

                        <p>
                            Steps:
                            ${escapeHTML(reading.steps || "Not entered")}
                        </p>

                    </div>
                `).join("") || "<p>No readings recorded.</p>"}

                <p class="muted">
                    Health Connect integration planned.
                    Manual logging only for now.
                </p>

            </section>
        `;
    }

    // CARE TEAM CONNECTIVITY

    if (currentPage === "Care Team") {

        html = `
            <section class="card">

                <h2>Your healthcare team</h2>

                <p>Cardiovascular recovery support</p>

                <form id="appointmentForm">

                    <label>Next follow-up appointment</label>

                    <input id="appointmentDate" type="date"
                        required
                        value="${escapeHTML(state.appointment)}">

                    <button>Save appointment</button>

                </form>

            </section>

            <section class="card">

                <h2>Message your care team</h2>

                <form id="messageForm">

                    <textarea id="message" required
                        placeholder="Write a non-urgent message">
                    </textarea>

                    <button>Save demo message</button>

                </form>

                ${state.messages.map(message => `
                    <div class="entry">
                        ${escapeHTML(message)}
                        <p class="muted">Not sent</p>
                    </div>
                `).join("")}

            </section>
        `;
    }

    // CAREGIVER SUPPORT

    if (currentPage === "Caregiver Support") {

        html = `
            <section class="card">

                <h2>Caregiver support</h2>

                <label class="task">

                    <input type="checkbox" id="shareProgress"
                        ${state.shareProgress ? "checked" : ""}>

                    Allow progress sharing (demo)

                </label>

                <p>
                    Journal entries remain private.
                    No information is actually shared yet.
                </p>

                <button id="requestHelp">
                    Request caregiver assistance
                </button>

                <p>
                    ${state.caregiverRequests}
                    simulated assistance requests
                </p>

            </section>
        `;
    }

    // ESP32 DEVICE MANAGEMENT

    if (currentPage === "My Device") {

        html = deviceCard() + `
            <section class="card">

                <h2>Test LED matrix commands</h2>

                <div class="row">

                    ${Object.keys(patterns).map(command => `
                        <button data-device="${command}"
                            class="secondary">
                            ${command}
                        </button>
                    `).join("")}

                </div>

                <div class="entry">
                    Command: ${state.device}
                </div>

                <button data-device="DONE">
                    Simulate hardware acknowledgment
                </button>

            </section>
        `;
    }

    $("content").innerHTML = html;
}

// ALLERGY SCREENING

function allergyMatch(name) {
    return state.allergies.some(allergy =>
        allergy.name.trim().toLowerCase() ===
        name.trim().toLowerCase()
    );
}

// BUTTON EVENTS

document.addEventListener("click", event => {

    const button = event.target.closest("button");

    if (!button) return;

    if (button.dataset.page) {
        currentPage = button.dataset.page;
        render();
        window.scrollTo(0, 0);
    }

    if (button.dataset.device) {
        setDevice(button.dataset.device);
        render();
    }

    if (button.dataset.med !== undefined) {

        state.medications[
            Number(button.dataset.med)
        ].taken = true;

        setDevice("DONE");
        save();
        render();
    }

    if (button.dataset.exercise !== undefined) {

        const exercise = state.exercises[
            Number(button.dataset.exercise)
        ];

        exercise.done = Math.min(
            exercise.done + 1,
            exercise.target
        );

        setDevice("DONE");
        save();
        render();
    }

    if (button.id === "emergency") {

        notify(
            "For a medical emergency, call 911 in the US. " +
            "CareBeyond cannot contact emergency services."
        );
    }

    if (button.id === "testReminder") {
        setDevice("MED");
        notify("Medication reminder simulation activated.");
        render();
    }

    if (button.id === "requestHelp") {
        state.caregiverRequests++;
        notify("Demo request recorded. No notification sent.");
        save();
        render();
    }
});

// CHECKBOX EVENTS

document.addEventListener("change", event => {

    const input = event.target;

    if (input.dataset.goal !== undefined) {

        state.goals[
            Number(input.dataset.goal)
        ].done = input.checked;

        if (input.checked) setDevice("DONE");

        save();
        render();
    }

    if (input.id === "shareProgress") {
        state.shareProgress = input.checked;
        save();
    }
});

// FORM EVENTS

document.addEventListener("submit", event => {

    event.preventDefault();

    const date = new Date().toLocaleString();

    switch (event.target.id) {

        case "profileForm":

            state.profile = {
                name: $("patientName").value,
                age: Number($("age").value),
                weight: Number($("weight").value),
                surgery: $("surgeryType").value,
                date: $("surgeryDate").value
            };

            notify("Patient profile updated.");
            break;

        case "goalForm":

            state.goals.push({
                name: $("newGoal").value,
                done: false
            });

            break;

        case "medicationForm":

            state.medications.push({
                name: $("medName").value,
                dose: $("medDose").value,
                time: $("medTime").value,
                taken: false
            });

            if (allergyMatch($("medName").value)) {
                notify(
                    "Reported allergy match. " +
                    "Contact your pharmacist."
                );
            }

            break;

        case "journalForm":

            state.journal.unshift({
                date,
                mood: $("mood").value,
                note: $("journalNote").value.trim()
            });

            currentPage = "My Journal";
            break;

        case "waterForm":

            state.water += Number(
                $("waterAmount").value
            );

            break;

        case "waterGoalForm":

            state.waterGoal = Number(
                $("waterTarget").value
            );

            break;

        case "exerciseForm":

            state.exercises.push({
                name: $("exerciseName").value,
                target: Number($("exerciseTarget").value),
                done: 0
            });

            break;

        case "allergyForm":

            state.allergies.push({
                name: $("allergen").value,
                reaction: $("reaction").value
            });

            break;

        case "checkinForm":

            const symptom = $("symptom").value;

            state.checkins.unshift({
                date,
                pain: Number($("pain").value),
                symptom,
                activity: $("activity").value,
                note: $("healthNote").value
            });

            const emergencySymptoms = [
                "New or worsening chest pain",
                "Severe difficulty breathing",
                "Fainting",
                "Severe allergic reaction",
                "Stroke signs"
            ];

            if (emergencySymptoms.includes(symptom)) {

                setDevice("ALERT");

                notify(
                    "These symptoms may be an emergency. " +
                    "Call 911 in the US. Do not wait for the app."
                );

            } else if (
                symptom === "New dizziness" ||
                symptom === "Worsening symptoms"
            ) {

                notify(
                    "Contact your care team promptly. " +
                    "If severe or rapidly worsening, " +
                    "seek emergency help."
                );

            } else {

                setDevice("DONE");

                notify(
                    "Check-in recorded. This does not " +
                    "establish that your symptoms are safe."
                );
            }

            break;

        case "chatForm":

            state.chat.push(
                "You: " + $("question").value
            );

            state.chat.push(
                "CareBeyond: This is a demo response. " +
                "Review your approved discharge instructions " +
                "or contact your care team for personalized advice."
            );

            break;

        case "monitorForm":

            state.readings.unshift({
                date,
                bp: $("bloodPressure").value,
                oxygen: $("oxygen").value,
                steps: $("steps").value
            });

            break;

        case "appointmentForm":

            state.appointment = $("appointmentDate").value;
            break;

        case "refillForm":

            state.refill = $("refillDate").value;
            break;

        case "messageForm":

            state.messages.unshift($("message").value);
            break;
    }

    save();
    render();
});

// MEDICATION REMINDER TIMER
// Demonstration only. Requires an open browser.

setInterval(() => {

    resetDaily();

    const now = new Date();

    const time = now.toTimeString().slice(0, 5);

    const today = now.toDateString();

    const due = state.medications.filter(med =>
        med.time === time &&
        med.lastReminder !== today &&
        !med.taken
    );

    if (due.length > 0) {

        due.forEach(med => {
            med.lastReminder = today;
        });

        setDevice("MED");

        notify(
            "Scheduled medication reminder: " +
            due.map(med => med.name).join(", ") +
            ". Review your prescribed instructions."
        );

        save();
        render();
    }

}, 1000);

// START WEBSITE

render();

// ============================================
// CAREBEYOND — RECOVERY GUIDE EXTENSION
// Paste at the bottom of your existing script.js
// ============================================


// ADD NEW NAVIGATION SECTIONS

pages.splice(
    pages.findIndex(page =>
        page[1] === "Nutrition & Hydration"
    ) + 1,
    0,
    ["🚫", "Foods to Avoid"]
);

pages.splice(
    pages.findIndex(page =>
        page[1] === "Safety Center"
    ),
    0,
    ["🩺", "Symptom Guide"]
);


// ============================================
// FOODS TO AVOID DATA
// ============================================

const recoveryFoods = [

    {
        icon: "🍟",
        name: "Fried Foods",
        examples: "French fries, fried chicken, fried snacks",
        reason: "Often contain high amounts of saturated fat and sodium.",
        alternative: "Baked or grilled foods."
    },

    {
        icon: "🧂",
        name: "High-Sodium Foods",
        examples: "Potato chips, instant noodles, canned soups",
        reason: "Excess sodium may increase blood pressure and fluid retention.",
        alternative: "Fresh foods and suitable low-sodium options."
    },

    {
        icon: "🥓",
        name: "Processed Meats",
        examples: "Bacon, sausage, hot dogs, deli meats",
        reason: "Often contain high amounts of sodium and saturated fat.",
        alternative: "Lean chicken, fish or approved plant proteins."
    },

    {
        icon: "🍩",
        name: "Sugary Foods",
        examples: "Candy, donuts, cakes, cookies",
        reason: "May make blood sugar management more difficult.",
        alternative: "Fresh fruit that fits your prescribed diet."
    },

    {
        icon: "🥤",
        name: "Sugary Drinks",
        examples: "Soda, sweetened tea, sugary juices",
        reason: "Contain added sugars that can affect blood sugar.",
        alternative: "Approved unsweetened drinks within your fluid limit."
    },

    {
        icon: "🍺",
        name: "Alcohol",
        examples: "Beer, wine and liquor",
        reason: "May interact with medications and interfere with recovery.",
        alternative: "Avoid until cleared by your healthcare provider."
    },

    {
        icon: "🧈",
        name: "High Saturated-Fat Foods",
        examples: "Butter, fatty meats, heavy cream",
        reason: "Can contribute to increased LDL cholesterol.",
        alternative: "Suitable unsaturated fats and lean proteins."
    },

    {
        icon: "🍔",
        name: "Fast Food",
        examples: "Burgers, pizza and processed meals",
        reason: "Frequently high in sodium and saturated fat.",
        alternative: "Home-prepared meals following your care plan."
    },

    {
        icon: "⚡",
        name: "Energy Drinks",
        examples: "Highly caffeinated energy beverages",
        reason: "Stimulants may affect blood pressure and heart rhythm.",
        alternative: "Ask your care team which beverages are appropriate."
    },

    {
        icon: "🍊",
        name: "Food-Medication Interactions",
        examples: "Grapefruit and certain medications",
        reason: "Some foods can change how medications work.",
        alternative: "Ask your pharmacist about your specific prescriptions."
    }

];


// ============================================
// COMMON POST-SURGERY SYMPTOMS
// ============================================

const recoverySymptoms = [

    {
        level: "Level 1",
        title: "Common Recovery Symptoms",
        color: "routine",
        icon: "✓",

        symptoms: [

            {
                name: "Mild fatigue",
                action: "Rest and follow your approved activity schedule. Contact your care team if fatigue worsens."
            },

            {
                name: "Reduced appetite",
                action: "Try smaller meals that fit your prescribed diet. Contact your care team if you cannot eat or drink adequately."
            },

            {
                name: "Expected incision soreness",
                action: "Follow your prescribed pain management instructions. Report increasing or unusual pain."
            },

            {
                name: "Difficulty sleeping",
                action: "Maintain a regular sleep schedule and discuss persistent problems with your healthcare provider."
            },

            {
                name: "Constipation",
                action: "Ask your care team about suitable foods, activity and approved treatments."
            },

            {
                name: "Mild mood changes",
                action: "Talk with your support network. Discuss persistent sadness or anxiety with your healthcare provider."
            }

        ]
    },

    {
        level: "Level 2",
        title: "Contact Your Care Team Promptly",
        color: "urgent",
        icon: "⚠",

        symptoms: [

            {
                name: "New dizziness",
                action: "Stop activity, sit safely and contact your care team promptly. Call 911 for severe or persistent dizziness or accompanying emergency symptoms."
            },

            {
                name: "Fever or chills",
                action: "Contact your surgical team and follow your discharge temperature instructions."
            },

            {
                name: "Increasing wound redness",
                action: "Contact your surgeon about possible infection."
            },

            {
                name: "Wound drainage or opening",
                action: "Contact your surgical team promptly."
            },

            {
                name: "New or increasing swelling",
                action: "Contact your care team for assessment."
            },

            {
                name: "Rapid weight gain",
                action: "Contact your care team about possible fluid retention."
            },

            {
                name: "Increasing incision pain",
                action: "Contact your surgeon. New or unusual chest pain requires emergency help."
            },

            {
                name: "Persistent nausea or vomiting",
                action: "Contact your care team, especially if you cannot keep down prescribed medications or fluids."
            }

        ]
    },

    {
        level: "Level 3",
        title: "Emergency Warning Signs",
        color: "critical",
        icon: "!",

        symptoms: [

            {
                name: "New or unusual chest pain",
                action: "Call 911 immediately. Do not drive yourself."
            },

            {
                name: "New or unusual difficulty breathing",
                action: "Call 911 immediately."
            },

            {
                name: "Fainting or loss of consciousness",
                action: "Call 911 immediately."
            },

            {
                name: "Sudden difficulty speaking",
                action: "Call 911 immediately. This may be a stroke warning sign."
            },

            {
                name: "Sudden facial drooping or weakness",
                action: "Call 911 immediately."
            },

            {
                name: "Severe allergic reaction",
                action: "Call 911 immediately and follow your prescribed emergency allergy plan."
            },

            {
                name: "Uncontrolled bleeding",
                action: "Call 911 immediately."
            }

        ]
    }

];


// ============================================
// FOODS TO AVOID PAGE
// ============================================

function renderFoodsToAvoid() {

    return `

        <section class="card hero">

            <small>PERSONALIZED RECOVERY NUTRITION</small>

            <h2>Eat smarter. Recover stronger.</h2>

            <p>
                ${escapeHTML(state.profile.name)},
                learn which foods may need to be limited
                during your recovery journey.
            </p>

            <button class="secondary"
                data-page="Nutrition & Hydration">
                View nutrition and hydration →
            </button>

        </section>


        <section class="card">

            <h2>Foods to limit or avoid</h2>

            <p>
                Your dietary restrictions depend on
                your surgery, medications, allergies
                and discharge instructions.
            </p>

            <label for="foodSearch">Search foods</label>

            <input id="foodSearch"
                placeholder="Search sodium, sugar, fried foods..."
                oninput="filterRecoveryFoods(this.value)">

            <div class="avoid-grid">

                ${recoveryFoods.map(food => `

                    <div class="avoid-card">

                        <div class="food-icon">
                            ${food.icon}
                        </div>

                        <span class="avoid-tag">
                            LIMIT / CHECK CARE PLAN
                        </span>

                        <h3>${food.name}</h3>

                        <p>
                            <strong>Examples:</strong>
                            ${food.examples}
                        </p>

                        <p>
                            <strong>Why limit it?</strong>
                            ${food.reason}
                        </p>

                        <div class="healthy-swap">

                            <strong>
                                ✓ Better alternative
                            </strong>

                            <p>${food.alternative}</p>

                        </div>

                    </div>

                `).join("")}

            </div>

            <p id="foodSearchEmpty"
                class="search-empty" hidden>
                No matching foods found.
                Ask your care team about specific foods.
            </p>

        </section>


        <section class="card">

            <span class="pill">PERSONALIZED SAFETY</span>

            <h2>Your recorded allergies</h2>

            ${state.allergies.map(allergy => `

                <div class="entry">

                    <h3>
                        ${escapeHTML(allergy.name)}
                    </h3>

                    <p>
                        Reaction:
                        ${escapeHTML(allergy.reaction)}
                    </p>

                </div>

            `).join("") || "<p>No allergies recorded.</p>"}

            <button data-page="Allergies & Reactions">
                Manage my allergies
            </button>

            <p class="muted">
                Always check food ingredients and
                medication interactions. The website
                cannot determine whether a food is safe
                for you.
            </p>

        </section>


        <section class="card">

            <h2>Important nutrition information</h2>

            <p>
                Follow your prescribed sodium and fluid
                restrictions. Do not change your diet
                or medication based solely on this guide.
            </p>

            <a href="https://www.nhlbi.nih.gov/health/heart-healthy-living/healthy-foods"
                target="_blank"
                rel="noopener noreferrer">

                Learn more about heart-healthy eating

            </a>

        </section>

    `;

}


// ============================================
// SYMPTOM GUIDE PAGE
// ============================================

function renderSymptomGuide() {

    return `

        <section class="card hero">

            <small>UNDERSTAND YOUR RECOVERY</small>

            <h2>Know what your body is telling you.</h2>

            <p>
                ${escapeHTML(state.profile.name)}'s
                recovery journey
            </p>

            <h3>
                Day ${daysSinceSurgery()}
                since surgery
            </h3>

            <p>
                ${escapeHTML(state.profile.surgery)}
            </p>

        </section>


        <section class="card">

            <h2>When should I seek medical attention?</h2>

            <div class="level emergency">

                <strong>
                    For emergency symptoms, call 911
                    immediately.
                </strong>

                <p>
                    Do not wait for CareBeyond,
                    an AI response or a message
                    from your healthcare provider.
                </p>

            </div>

            <p>
                Some symptoms may occur during recovery,
                while others require immediate medical
                attention.
            </p>

            <p>
                Even a low pain score can accompany
                a serious medical emergency.
            </p>

            <label for="symptomSearch">
                Search your symptoms
            </label>

            <input id="symptomSearch"
                placeholder="Search fatigue, dizziness, swelling..."
                oninput="filterRecoverySymptoms(this.value)">

        </section>


        ${recoverySymptoms.map(group => `

            <section class="card symptom-group"
                data-severity="${group.color}">

                <div class="severity-header ${group.color}">

                    <div class="severity-icon">
                        ${group.icon}
                    </div>

                    <div>

                        <small>${group.level}</small>

                        <h2>${group.title}</h2>

                    </div>

                </div>

                ${group.symptoms.map(symptom => `

                    <div class="symptom-item">

                        <h3>${symptom.name}</h3>

                        <p>
                            <strong>
                                Recommended action:
                            </strong>

                            ${symptom.action}
                        </p>

                    </div>

                `).join("")}

                ${group.color === "critical" ? `

                    <a class="call-emergency"
                        href="tel:911">

                        Call 911 — United States

                    </a>

                ` : ""}

            </section>

        `).join("")}


        <p id="symptomSearchEmpty"
            class="search-empty" hidden>

            No matching symptoms found.
            This does not mean your symptoms are safe.
            Contact your care team or seek emergency
            help when appropriate.

        </p>


        <section class="card">

            <h2>Experiencing a symptom?</h2>

            <p>
                Record non-emergency symptoms in your
                daily health check-in to keep track
                of your recovery.
            </p>

            <div class="row">

                <button data-page="Health Check-in">
                    Complete health check-in
                </button>

                <button class="secondary"
                    data-page="Care Team">
                    View my care team
                </button>

            </div>

            <p class="muted">
                Check-ins are not actively monitored.
                This guide cannot diagnose conditions
                or determine whether symptoms are safe.
            </p>

        </section>


        <section class="card">

            <h2>Recovery education resources</h2>

            <a href="https://medlineplus.gov/ency/patientinstructions/000102.htm"
                target="_blank"
                rel="noopener noreferrer">

                MedlinePlus — Heart Bypass Surgery Recovery

            </a>

            <p class="muted">
                Follow the instructions specific to
                your surgery and healthcare provider.
            </p>

        </section>

    `;

}


// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function filterRecoveryFoods(search) {

    const query = search.toLowerCase().trim();

    let matches = 0;

    document.querySelectorAll(".avoid-card")
        .forEach(card => {

            const text = card.textContent.toLowerCase();

            const visible = text.includes(query);

            card.hidden = !visible;

            if (visible) matches++;

        });

    $("foodSearchEmpty").hidden = matches !== 0;

}


function filterRecoverySymptoms(search) {

    const query = search.toLowerCase().trim();

    let matches = 0;

    document.querySelectorAll(".symptom-group")
        .forEach(group => {

            let groupMatches = 0;

            group.querySelectorAll(".symptom-item")
                .forEach(item => {

                    const text =
                        item.textContent.toLowerCase();

                    const visible =
                        text.includes(query);

                    // Emergency signs remain visible.
                    const emergency =
                        group.dataset.severity === "critical";

                    item.hidden = !visible && !emergency;

                    if (visible) {
                        groupMatches++;
                        matches++;
                    }

                });

            // Never hide the emergency warning group.

            group.hidden =
                groupMatches === 0 &&
                group.dataset.severity !== "critical";

        });

    $("symptomSearchEmpty").hidden = matches !== 0;

}


// ============================================
// DASHBOARD QUICK ACCESS CARDS
// ============================================

function recoveryGuideShortcuts() {

    return `

        <div class="grid">

            <section class="card guide-shortcut">

                <div class="shortcut-icon">🥗</div>

                <span class="pill">
                    SMART NUTRITION
                </span>

                <h2>Foods to Avoid</h2>

                <p>
                    Learn which foods and drinks
                    may interfere with your recovery
                    and discover healthier alternatives.
                </p>

                <button data-page="Foods to Avoid">
                    Explore food guide →
                </button>

            </section>


            <section class="card guide-shortcut">

                <div class="shortcut-icon">🩺</div>

                <span class="pill">
                    RECOVERY SAFETY
                </span>

                <h2>Understand Your Symptoms</h2>

                <p>
                    Learn about common recovery
                    symptoms, warning signs and
                    when to seek medical attention.
                </p>

                <button data-page="Symptom Guide">
                    Explore symptom guide →
                </button>

            </section>

        </div>

    `;

}


// ============================================
// EXPAND HEALTH CHECK-IN OPTIONS
// ============================================

const additionalSymptoms = [

    "Reduced appetite",
    "Expected incision soreness",
    "Difficulty sleeping",
    "Constipation",
    "Mild mood changes",
    "Fever or chills",
    "Increasing wound redness",
    "Wound drainage or opening",
    "New or increasing swelling",
    "Rapid weight gain",
    "Increasing incision pain",
    "Persistent nausea or vomiting",
    "New or unusual difficulty breathing",
    "Uncontrolled bleeding"

];


const urgentRecoverySymptoms = [

    "Fever or chills",
    "Increasing wound redness",
    "Wound drainage or opening",
    "New or increasing swelling",
    "Rapid weight gain",
    "Increasing incision pain",
    "Persistent nausea or vomiting"

];


const emergencyRecoverySymptoms = [

    "New or unusual difficulty breathing",
    "Uncontrolled bleeding"

];


function expandCheckinSymptoms() {

    const select = $("symptom");

    if (!select) return;

    additionalSymptoms.forEach(symptom => {

        const alreadyExists =
            Array.from(select.options).some(
                option => option.value === symptom
            );

        if (!alreadyExists) {

            const option =
                document.createElement("option");

            option.value = symptom;
            option.textContent = symptom;

            select.appendChild(option);

        }

    });

}


// ============================================
// ADD NEW PAGES TO EXISTING RENDER FUNCTION
// ============================================

const originalRender = render;

render = function () {

    // Keep all original CareBeyond functionality.

    originalRender();


    // Render the Foods to Avoid page.

    if (currentPage === "Foods to Avoid") {

        $("content").innerHTML =
            renderFoodsToAvoid();

    }


    // Render the Symptom Guide page.

    if (currentPage === "Symptom Guide") {

        $("content").innerHTML =
            renderSymptomGuide();

    }


    // Add quick-access cards to the dashboard.

    if (currentPage === "Overview") {

        $("content").insertAdjacentHTML(
            "beforeend",
            recoveryGuideShortcuts()
        );

    }


    // Add a shortcut to the nutrition page.

    if (currentPage === "Nutrition & Hydration") {

        $("content").insertAdjacentHTML(
            "beforeend",

            `
                <section class="card">

                    <h2>🚫 What foods should I limit?</h2>

                    <p>
                        Explore foods to limit during
                        your recovery and learn about
                        healthier alternatives.
                    </p>

                    <button data-page="Foods to Avoid">
                        View foods to avoid →
                    </button>

                </section>
            `

        );

    }


    // Add a shortcut to the safety center.

    if (currentPage === "Safety Center") {

        $("content").insertAdjacentHTML(
            "beforeend",

            `
                <section class="card">

                    <h2>🩺 Common recovery symptoms</h2>

                    <p>
                        Understand which symptoms
                        may occur during recovery
                        and when to seek help.
                    </p>

                    <button data-page="Symptom Guide">
                        Open symptom guide →
                    </button>

                </section>
            `

        );

    }


    // Expand the health check-in page.

    if (currentPage === "Health Check-in") {

        expandCheckinSymptoms();

        $("content").insertAdjacentHTML(
            "beforeend",

            `
                <section class="card">

                    <h2>Unsure about a symptom?</h2>

                    <p>
                        Review common symptoms
                        and emergency warning signs.
                    </p>

                    <button data-page="Symptom Guide">
                        View symptom guide →
                    </button>

                </section>
            `

        );

    }

};


// ============================================
// HANDLE ADDITIONAL HEALTH CHECK-IN SYMPTOMS
// ============================================

document.addEventListener("submit", event => {

    if (event.target.id !== "checkinForm") {
        return;
    }

    const symptom = $("symptom").value;

    const pain = Number($("pain").value);

    const isEmergency =
        emergencyRecoverySymptoms.includes(symptom);

    const isUrgent =
        urgentRecoverySymptoms.includes(symptom);

    // Existing emergency symptoms are handled
    // by your original check-in function.

    const originalEmergency = [

        "New or worsening chest pain",
        "Severe difficulty breathing",
        "Fainting",
        "Severe allergic reaction",
        "Stroke signs"

    ].includes(symptom);


    if (!isEmergency &&
        !isUrgent &&
        (pain < 7 || originalEmergency)) {

        return;

    }


    // Handle new warning signs before the original
    // form handler to avoid duplicate check-ins.

    event.preventDefault();

    event.stopImmediatePropagation();


    state.checkins.unshift({

        date: new Date().toLocaleString(),

        pain,

        symptom,

        activity: $("activity").value,

        note: $("healthNote").value

    });


    if (isEmergency) {

        setDevice("ALERT");

        notify(
            "EMERGENCY WARNING: Call 911 immediately. " +
            "Do not wait for CareBeyond."
        );

    } else {

        setDevice("ALERT");

        notify(
            "Contact your care team promptly. " +
            "For emergency symptoms, call 911."
        );

    }


    save();

    render();

    window.scrollTo(0, 0);

}, true);


// ============================================
// START UPDATED CAREBEYOND WEBSITE
// ============================================

render();

// ============================================
// DAILY RECOVERY REMINDERS
// ============================================

const dailyRecoveryReminders = [
    {
        icon: "💧",
        title: "Stay hydrated!",
        message: "Not drinking enough fluid may cause dehydration, dizziness, fatigue and constipation. Follow your care team's daily fluid target.",
        button: "Log your hydration",
        page: "Nutrition & Hydration"
    },
    {
        icon: "💊",
        title: "Remember your medication!",
        message: "Missing prescribed medications may interfere with your treatment and recovery. Follow your medication schedule.",
        button: "View medications",
        page: "Medications"
    },
    {
        icon: "🚶",
        title: "Keep moving safely!",
        message: "Prolonged inactivity may contribute to muscle weakness and blood clots. Complete your approved rehabilitation activities.",
        button: "View rehabilitation",
        page: "Rehabilitation"
    },
    {
        icon: "🥗",
        title: "Fuel your recovery!",
        message: "Inadequate nutrition may slow wound healing and contribute to fatigue. Follow your prescribed nutrition plan.",
        button: "View nutrition",
        page: "Nutrition & Hydration"
    },
    {
        icon: "🧂",
        title: "Watch your sodium intake!",
        message: "Excess sodium may contribute to fluid retention and increased blood pressure. Follow your prescribed sodium restrictions.",
        button: "View foods to avoid",
        page: "Foods to Avoid"
    },
    {
        icon: "💤",
        title: "Give your body time to rest!",
        message: "Insufficient sleep may contribute to fatigue and make recovery more difficult. Prioritize rest during your recovery.",
        button: "Open your journal",
        page: "My Journal"
    },
    {
        icon: "🩹",
        title: "Pay attention to your incision!",
        message: "Increasing redness, drainage or swelling around your incision may indicate a complication. Contact your surgical team promptly.",
        button: "View symptom guide",
        page: "Symptom Guide"
    }
];

let recoveryReminderIndex = 0;


// DISPLAY THE CURRENT REMINDER

function displayRecoveryReminder() {

    const reminderCard =
        document.getElementById("dailyRecoveryReminder");

    if (!reminderCard) return;

    const reminder =
        dailyRecoveryReminders[recoveryReminderIndex];

    reminderCard.innerHTML = `

        <div class="reminder-icon">
            ${reminder.icon}
        </div>

        <small class="reminder-label">
            DAILY RECOVERY REMINDER
        </small>

        <h3>${reminder.title}</h3>

        <p>${reminder.message}</p>

        <button class="reminder-action"
            data-page="${reminder.page}">
            ${reminder.button} →
        </button>

        <div class="reminder-controls">

            <button onclick="changeRecoveryReminder(-1)"
                aria-label="Previous reminder">
                ←
            </button>

            <div class="reminder-dots">

                ${dailyRecoveryReminders.map((item, index) => `
                    <span class="reminder-dot
                        ${index === recoveryReminderIndex
                            ? "selected" : ""}">
                    </span>
                `).join("")}

            </div>

            <button onclick="changeRecoveryReminder(1)"
                aria-label="Next reminder">
                →
            </button>

        </div>

    `;
}


// SWITCH BETWEEN REMINDERS

function changeRecoveryReminder(direction) {

    recoveryReminderIndex =
        (recoveryReminderIndex + direction +
        dailyRecoveryReminders.length)
        % dailyRecoveryReminders.length;

    displayRecoveryReminder();
}


// ADD THE REMINDER TO THE OVERVIEW

const renderBeforeReminder = render;

render = function () {

    renderBeforeReminder();

    if (currentPage !== "Overview") return;

    const hero = document.querySelector("#content .hero");

    if (!hero) return;

    hero.classList.add("hero-with-reminder");

    if (!document.getElementById("dailyRecoveryReminder")) {

        hero.insertAdjacentHTML("beforeend", `
            <div class="daily-reminder"
                id="dailyRecoveryReminder">
            </div>
        `);

    }

    displayRecoveryReminder();
};


// AUTOMATICALLY ROTATE EVERY 12 SECONDS

setInterval(() => {

    if (
        currentPage === "Overview" &&
        !document.querySelector(".daily-reminder:hover") &&
        !document.querySelector(".daily-reminder:focus-within")
    ) {
        changeRecoveryReminder(1);
    }

}, 12000);


// REFRESH WEBSITE

render();


// ============================================
// COMPACT CIRCULAR PROGRESS TRACKERS
// ============================================

function createProgressRing(
    title, value, total, color, description, page, display
) {
    const percent = total > 0
        ? Math.min(100, Math.max(0, value / total * 100))
        : 0;

    const circumference = 2 * Math.PI * 48;

    return `
        <section class="card circular-card">

            <small>${title}</small>

            <div class="circular-progress">

                <svg viewBox="0 0 120 120">

                    <circle cx="60" cy="60" r="48"
                        class="ring-background">
                    </circle>

                    <circle cx="60" cy="60" r="48"
                        class="ring-fill"
                        style="
                            stroke: ${color};
                            stroke-dasharray: ${circumference};
                            stroke-dashoffset:
                                ${circumference * (1 - percent / 100)};
                            opacity: ${percent === 0 ? 0 : 1};
                        ">
                    </circle>

                </svg>

                <div class="ring-text">
                    <strong>${display}</strong>
                </div>

            </div>

            <p>${description}</p>

            <button data-page="${page}">
                View details →
            </button>

        </section>
    `;
}


function upgradeProgressTrackers() {

    const stats = document.querySelector("#content .stats");

    if (!stats) return;

    const completed = state.goals.filter(
        goal => goal.done
    ).length;

    const taken = state.medications.filter(
        med => med.taken
    ).length;

    stats.innerHTML = `

        ${createProgressRing(
            "Daily goals",
            completed,
            state.goals.length,
            "#3478F6",
            "Goals completed",
            "Recovery Timeline",
            completed + "/" + state.goals.length
        )}

        ${createProgressRing(
            "Hydration",
            state.water,
            state.waterGoal,
            "#38A5D8",
            state.water + " mL logged",
            "Nutrition & Hydration",
            state.waterGoal
                ? Math.round(
                    state.water / state.waterGoal * 100
                ) + "%"
                : "—"
        )}

        ${createProgressRing(
            "Medications",
            taken,
            state.medications.length,
            "#14B8A6",
            "Doses recorded",
            "Medications",
            taken + "/" + state.medications.length
        )}

    `;
}


// ============================================
// INTERACTIVE HYDRATION BOTTLE
// ============================================

function hydrationBottle() {

    const percentage = state.waterGoal > 0
        ? Math.min(100, state.water / state.waterGoal * 100)
        : 0;

    return `

        <div class="hydration-visual">

            <div class="bottle-container">

                <div class="bottle-cap"></div>
                <div class="bottle-neck"></div>

                <div class="water-bottle">

                    <div class="bottle-water"
                        style="height:${percentage}%">
                    </div>

                    <div class="bottle-measurements">
                        <span>100%</span>
                        <span>75%</span>
                        <span>50%</span>
                        <span>25%</span>
                    </div>

                </div>

            </div>

            <div class="hydration-information">

                <small>DAILY FLUID INTAKE</small>

                <h2>${state.water} mL</h2>

                <p>
                    ${state.waterGoal
                        ? state.waterGoal + " mL target"
                        : "Fluid target not set"}
                </p>

                <strong>
                    ${state.waterGoal
                        ? Math.round(
                            state.water / state.waterGoal * 100
                        ) + "%"
                        : "—"}
                </strong>

                <p class="muted">
                    Follow your care team's fluid instructions.
                </p>

            </div>

        </div>

        ${state.waterGoal > 0 &&
          state.water > state.waterGoal ? `
            <div class="level urgent">
                Recorded intake exceeds your saved target.
                Follow your prescribed fluid restrictions.
            </div>
        ` : ""}

        <div class="quick-water-buttons">

            <button class="secondary"
                data-log-water="100">
                +100 mL
            </button>

            <button class="secondary"
                data-log-water="250">
                +250 mL
            </button>

            <button class="secondary"
                data-log-water="500">
                +500 mL
            </button>

        </div>

    `;
}


function upgradeHydrationTracker() {

    const waterNumber =
        document.querySelector("#content .water-number");

    if (!waterNumber) return;

    waterNumber.outerHTML = hydrationBottle();

}


document.addEventListener("click", event => {

    const button = event.target.closest("[data-log-water]");

    if (!button) return;

    const amount = Number(button.dataset.logWater);

    if (!Number.isFinite(amount) || amount <= 0) return;

    if (!confirm(
        "Log " + amount +
        " mL of fluid already consumed?"
    )) return;

    state.water += amount;

    setDevice("WATER");

    save();

    render();

});


// ============================================
// FOOD PHOTOGRAPHY
// ============================================

const nutritionPhotos = {

    "vegetables":
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",

    "whole grains":
        "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600",

    "protein":
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",

    "sodium & fluids":
        "https://images.unsplash.com/photo-1547592180-85f173990554?w=600",

    "fried":
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600",

    "fast food":
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",

    "sugary":
        "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600"

};


function upgradeFoodPhotography() {

    document.querySelectorAll(
        ".food-card, .avoid-card"
    ).forEach(card => {

        if (card.querySelector(".nutrition-photo")) return;

        const heading = card.querySelector("h3");

        if (!heading) return;

        const name = heading.textContent.toLowerCase();

        const match = Object.keys(nutritionPhotos).find(
            key => name.includes(key)
        );

        if (!match) return;

        const image = document.createElement("img");

        image.src = nutritionPhotos[match];

        image.alt = heading.textContent;

        image.className = "nutrition-photo";

        image.loading = "lazy";

        const oldIcon = card.querySelector(
            ".food-icon, :scope > span"
        );

        image.onload = () => {
            if (oldIcon) oldIcon.style.display = "none";
        };

        image.onerror = () => {
            image.remove();
            if (oldIcon) oldIcon.style.display = "";
        };

        card.prepend(image);

    });

}


// ============================================
// RECOVERY CALENDAR
// ============================================

let calendarMonth = new Date().getMonth();

let calendarYear = new Date().getFullYear();


function calendarDateKey(date) {

    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");

}


let selectedCalendarDate = calendarDateKey(new Date());


function calendarTime(time) {

    if (!time) return "Time not set";

    const [hours, minutes] = time.split(":").map(Number);

    return `${hours % 12 || 12}:${String(minutes)
        .padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;

}


function recoveryCalendar() {

    const today = calendarDateKey(new Date());

    const monthName = new Date(
        calendarYear,
        calendarMonth,
        1
    ).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    const firstDay = new Date(
        calendarYear,
        calendarMonth,
        1
    ).getDay();

    const daysInMonth = new Date(
        calendarYear,
        calendarMonth + 1,
        0
    ).getDate();

    let dates = "";

    for (let i = 0; i < firstDay; i++) {

        dates += `<div></div>`;

    }

    for (let day = 1; day <= daysInMonth; day++) {

        const date = calendarDateKey(
            new Date(calendarYear, calendarMonth, day)
        );

        const hasEvent =
            date === state.appointment ||
            date === state.refill;

        dates += `

            <button
                class="calendar-day
                    ${date === today ? "calendar-today" : ""}
                    ${date === selectedCalendarDate
                        ? "calendar-selected" : ""}
                    ${hasEvent ? "calendar-event" : ""}"
                data-calendar-date="${date}">

                ${day}

                ${hasEvent
                    ? '<span class="calendar-dot"></span>'
                    : ""}

            </button>

        `;

    }

    return `

        <section class="card hero">

            <small>PLAN YOUR RECOVERY</small>

            <h2>Every day is a new step.</h2>

            <p>
                Stay organized with your medications,
                recovery goals and follow-up appointments.
            </p>

        </section>

        <section class="card recovery-calendar">

            <div class="calendar-header">

                <h2>${monthName}</h2>

                <div class="calendar-navigation">

                    <button class="secondary"
                        data-calendar-move="-1">
                        ←
                    </button>

                    <button class="secondary"
                        data-calendar-today>
                        Today
                    </button>

                    <button class="secondary"
                        data-calendar-move="1">
                        →
                    </button>

                </div>

            </div>

            <div class="calendar-layout">

                <div>

                    <div class="calendar-grid">

                        ${[
                            "Sun", "Mon", "Tue", "Wed",
                            "Thu", "Fri", "Sat"
                        ].map(day => `
                            <div class="calendar-weekday">
                                ${day}
                            </div>
                        `).join("")}

                        ${dates}

                    </div>

                    <div class="calendar-legend">
                        🔵 Today &nbsp;&nbsp;
                        🟢 Appointment or refill
                    </div>

                </div>

                <div class="calendar-schedule">

                    ${recoveryDaySchedule()}

                </div>

            </div>

        </section>

    `;

}


// ============================================
// CALENDAR DAILY SCHEDULE
// ============================================

function recoveryDaySchedule() {

    const today = calendarDateKey(new Date());

    const isToday = selectedCalendarDate === today;

    const dateLabel = new Date(
        selectedCalendarDate + "T00:00:00"
    ).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric"
    });

    const events = [];

    if (selectedCalendarDate === state.appointment) {

        events.push({
            icon: "🩺",
            name: "Follow-up appointment",
            time: "Confirm appointment time",
            page: "Care Team"
        });

    }

    if (selectedCalendarDate === state.refill) {

        events.push({
            icon: "💊",
            name: "Medication refill",
            time: "Saved refill date",
            page: "Medications"
        });

    }

    if (isToday) {

        [...state.medications]
            .sort((a, b) =>
                (a.time || "").localeCompare(b.time || "")
            )
            .forEach(med => {

                events.push({
                    icon: "💊",
                    name: med.name,
                    time: calendarTime(med.time),
                    page: "Medications",
                    done: med.taken
                });

            });

        events.push({
            icon: "📋",
            name: "Daily recovery goals",
            time: "Complete approved goals",
            page: "Recovery Timeline"
        });

        state.exercises.forEach(exercise => {

            events.push({
                icon: "🚶",
                name: exercise.name,
                time: exercise.done + "/" +
                    exercise.target + " completed",
                page: "Rehabilitation",
                done: exercise.done >= exercise.target
            });

        });

        events.push({
            icon: "💧",
            name: "Hydration tracking",
            time: state.water + " mL recorded",
            page: "Nutrition & Hydration"
        });

        events.push({
            icon: "♡",
            name: "Daily health check-in",
            time: "Record your recovery progress",
            page: "Health Check-in"
        });

    }

    return `

        <span class="pill">
            ${isToday ? "TODAY'S SCHEDULE" : "SELECTED DATE"}
        </span>

        <h3>${dateLabel}</h3>

        ${events.map(event => `

            <button class="calendar-schedule-item"
                data-page="${event.page}">

                <span class="schedule-icon">
                    ${event.icon}
                </span>

                <span class="schedule-details">

                    <strong>
                        ${escapeHTML(event.name)}
                    </strong>

                    <small>
                        ${escapeHTML(event.time)}
                    </small>

                </span>

                <span class="schedule-status">
                    ${event.done ? "✓" : "→"}
                </span>

            </button>

        `).join("") || `

            <p class="muted">
                No appointments or refill dates saved.
            </p>

        `}

        <button class="secondary calendar-appointment"
            data-page="Care Team">

            Manage appointments →

        </button>

    `;

}


// ============================================
// CALENDAR NAVIGATION
// ============================================

document.addEventListener("click", event => {

    const move = event.target.closest(
        "[data-calendar-move]"
    );

    const date = event.target.closest(
        "[data-calendar-date]"
    );

    const today = event.target.closest(
        "[data-calendar-today]"
    );

    if (move) {

        const next = new Date(
            calendarYear,
            calendarMonth + Number(move.dataset.calendarMove),
            1
        );

        calendarMonth = next.getMonth();

        calendarYear = next.getFullYear();

        render();

    }

    if (date) {

        selectedCalendarDate = date.dataset.calendarDate;

        render();

    }

    if (today) {

        const now = new Date();

        calendarMonth = now.getMonth();

        calendarYear = now.getFullYear();

        selectedCalendarDate = calendarDateKey(now);

        render();

    }

});


// ============================================
// CONNECT NEW FEATURES TO EXISTING WEBSITE
// ============================================

const renderBeforeVisualUpgrade = render;

render = function () {

    renderBeforeVisualUpgrade();

    if (currentPage === "Overview") {

        upgradeProgressTrackers();

    }

    if (currentPage === "Recovery Calendar") {

        $("content").innerHTML = recoveryCalendar();

    }

    if (currentPage === "Nutrition & Hydration") {

        upgradeHydrationTracker();

        upgradeFoodPhotography();

    }

    if (currentPage === "Foods to Avoid") {

        upgradeFoodPhotography();

    }

};

render();

// PulseGuard AI integration — fictional demonstration only.
const renderBeforePulseGuard = render;
render = function () {
    renderBeforePulseGuard();
    if (currentPage !== 'Health Monitoring') return;
    $('content').insertAdjacentHTML('afterbegin', `
      <section class="card pulseguard">
        <span class="pill">PULSEGUARD AI · RESEARCH DEMO</span>
        <h2>Cardiac AI demonstration</h2>
        <p>Explore a PyTorch classification and Gemini explanation using fictional data only. Not a diagnosis or emergency assessment.</p>
        <form id="pulseForm">
          <div class="pulse-inputs">
            <label>Age <input name="age" type="number" min="18" max="120" value="62" required></label>
            <label>Gender <select name="sex"><option value="1">Male (1)</option><option value="0">Female (0)</option></select></label>
            <label>Systolic blood pressure (mmHg)<input name="trestbps" type="number" min="50" max="300" value="120" required></label>
            <label>Cholesterol (mg/dL)<input name="chol" type="number" min="50" max="1000" value="200" required></label>
          </div>
          <button type="submit">Run AI demonstration</button>
          <button type="button" class="secondary" id="pulseConnect">Connect demo ESP32</button>
          <p class="muted" id="pulseSerial">${pulsePort ? 'Serial port selected' : 'Hardware optional · USB serial'}</p>
        </form>
        <div id="pulseResult" aria-live="polite"></div>
      </section>`);
    $('pulseConnect').onclick = async () => {
        try {
            if (!navigator.serial) throw Error('Use Chrome or Edge on localhost.');
            if (!pulsePort) { const port = await navigator.serial.requestPort(); await port.open({baudRate:9600}); pulsePort = port; }
            $('pulseSerial').textContent = 'Serial connected';
        } catch(e) { $('pulseSerial').textContent = e.message; }
    };
    $('pulseForm').addEventListener('submit', async event => {
        event.preventDefault(); event.stopPropagation();
        const form = event.currentTarget, output = $('pulseResult'), button = form.querySelector('[type=submit]');
        button.disabled = true; output.textContent = 'Running model…';
        try {
            const response = await fetch('/api/predict', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.fromEntries(new FormData(form)))});
            const data = await response.json();
            if (!response.ok) throw Error(data.error || 'Model request failed');
            const labels = [' Your in good health!','Warning ⚠️','Please visit a doctor'];
            const colors = ['#16803c','#996000','#c92c40'];
            output.innerHTML = `<div class="pulse-outcome"><h3 style="color:${colors[data.category]}">${labels[data.category]} · experimental output</h3>${(data.scores || []).map((score,i)=>`<div class="pulse-score"><span>${labels[i]}</span><strong>${score.toFixed(1)}%</strong></div><div class="progress"><span style="width:${score}%;background:${colors[i]}"></span></div>`).join('')}<p class="muted">Softmax scores for a matched historical record, not personal disease probabilities.</p><h3>${escapeHTML(data.source)}</h3><p>${escapeHTML(data.advice)}</p><p class="muted">Never use this output to decide whether to seek medical care.</p></div>`;
            if (pulsePort) {
                try {
                    const writer = pulsePort.writable.getWriter();
                    try { await writer.write(new TextEncoder().encode(data.command+'\n')); } finally { writer.releaseLock(); }
                    output.insertAdjacentHTML('beforeend','<p>Demo command sent over USB.</p>');
                } catch { output.insertAdjacentHTML('beforeend','<p>Hardware send failed; model result is still available.</p>'); }
            }
        } catch(e) { output.textContent = 'Unable to run model: '+e.message+' — open the website through the Flask server.'; }
        finally { button.disabled = false; }
    });
};
let pulsePort = null;
render();