// --- DATA STORE ---
const initialData = {
    meds: [],
    contacts: [],
    tasks: [],
    schedule: [],
    notes: [],
    shop: []
};

let data = JSON.parse(localStorage.getItem('silverLifeData')) || initialData;
let currentCall = null;

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    startClock();
    
    // Remove splash screen
    setTimeout(() => {
        const splash = document.getElementById('splash');
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 700);
    }, 1500);

    // This section is commented out as the sw.js file is not provided.
    // if ('serviceWorker' in navigator) {
    //     navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
    // }
});

// --- ACCESSIBILITY LOGIC ---
window.toggleAccessBar = function() {
    document.getElementById('access-bar').classList.toggle('open');
}

window.setAccess = function(type, val) {
    if(type === 'reset') {
        // Reset to defaults
        document.documentElement.classList.remove('text-lg-mode', 'text-xl-mode');
        document.body.classList.remove('high-contrast', 'dark-mode', 'light-mode');
        return;
    }

    if(type === 'size') {
        // Apply class to HTML tag to affect REM units
        document.documentElement.classList.remove('text-lg-mode', 'text-xl-mode');
        if(val === 'large') document.documentElement.classList.add('text-lg-mode');
        if(val === 'xl') document.documentElement.classList.add('text-xl-mode');
    }
    if(type === 'mode') {
        document.body.classList.remove('high-contrast', 'dark-mode', 'light-mode');
        if(val === 'contrast') document.body.classList.add('high-contrast');
        if(val === 'dark') document.body.classList.add('dark-mode');
        if(val === 'light') document.body.classList.add('light-mode');
    }
}

window.readPage = function() {
    // Stop any current speech first
    window.speechSynthesis.cancel();

    // Get active section text
    const activeSection = document.querySelector('.page-section.active');
    if(!activeSection) return;

    // Clone and clean text (remove buttons text usually)
    const textToRead = activeSection.innerText.replace(/delete|add|edit|shop|call|meds|notes/gi, "");
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.9; // Slightly slower for seniors
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
}

window.stopReading = function() {
    window.speechSynthesis.cancel();
}

// --- CLOCK ---
function startClock() {
    function update() {
        const now = new Date();
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        document.getElementById('clock-date').innerText = now.toLocaleDateString('en-US', options);
        
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        const timeEl = document.getElementById('clock-time');
        if(timeEl) timeEl.innerText = `${hours}:${minutes}`;
        
        const ampmEl = document.getElementById('clock-ampm');
        if(ampmEl) ampmEl.innerText = ampm;
    }
    update();
    setInterval(update, 1000);
}

// --- NAVIGATION LOGIC ---
window.nav = function(pageId) {
    const titles = {
        'home': 'SilverAging', // <-- Fixed: Displays 'SilverAging' in the header
        'meds': 'My Medication',
        'tasks': 'To-Do List',
        'contacts': 'Emergency Contacts',
        'schedule': 'Daily Schedule',
        'wellness': 'Exercise & Relax',
        'notes': 'Journal',
        'shop': 'Shopping List'
    };
    document.getElementById('page-title').innerText = titles[pageId] || 'App';

    // Change Body Theme based on Section
    document.body.className = document.body.className.replace(/home-theme|meds-theme|contacts-theme|tasks-theme|shop-theme|wellness-theme|schedule-theme|notes-theme/g, '');
    document.body.classList.add(pageId + '-theme');

    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    // Update Bottom Bar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-teal-600', 'active-nav');
        btn.classList.add('text-gray-400');
    });
    
    const activeBtn = document.querySelector(`.nav-btn[data-target="${pageId}"]`);
    if(activeBtn) {
        activeBtn.classList.remove('text-gray-400');
        activeBtn.classList.add('text-teal-600', 'active-nav');
    }

    document.getElementById('app-container').scrollTo(0,0);
}

// --- FAKE CALL LOGIC ---
window.startFakeCall = function(name, number) {
    document.getElementById('fake-call-screen').classList.add('active');
    document.getElementById('call-name').innerText = name;
    document.getElementById('call-status').innerText = 'Calling...';
    currentCall = setTimeout(() => {
         document.getElementById('call-status').innerText = 'Ringing...';
    }, 2000);
}

window.endFakeCall = function() {
    document.getElementById('fake-call-screen').classList.remove('active');
    clearTimeout(currentCall);
}

// --- BREATHING EXERCISE ---
window.startBreathing = function() {
    const bar = document.getElementById('breath-bar');
    bar.style.width = '0%';
    
    setTimeout(() => {
        bar.style.transition = 'width 4s ease-out';
        bar.style.width = '100%';
        setTimeout(() => {
            setTimeout(() => {
                bar.style.transition = 'width 4s ease-in';
                bar.style.width = '0%';
            }, 4000);
        }, 4000);
    }, 100);
}

// --- MODAL LOGIC ---
window.openModal = function(id) {
    document.getElementById(id).classList.add('open');
}

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('open');
    document.querySelectorAll(`#${id} input, #${id} textarea`).forEach(input => input.value = '');
}

// --- CRUD OPERATIONS ---
function saveToLocal() {
    localStorage.setItem('silverLifeData', JSON.stringify(data));
    renderAll();
}

window.saveItem = function(type) {
    const id = Date.now().toString(); 
    
    if (type === 'meds') {
        const name = document.getElementById('med-name').value;
        const time = document.getElementById('med-time').value;
        const desc = document.getElementById('med-desc').value;
        if(!name) return alert('Please enter a name');
        data.meds.push({ id, name, time, desc });
        closeModal('med-modal');
    }
    else if (type === 'contacts') {
        const name = document.getElementById('contact-name').value;
        const phone = document.getElementById('contact-phone').value;
        if(!name || !phone) return alert('Name and phone required');
        data.contacts.push({ id, name, phone });
        closeModal('contact-modal');
    }
    else if (type === 'tasks') {
        const desc = document.getElementById('task-desc').value;
        if(!desc) return alert('Please enter a task');
        data.tasks.push({ id, desc, done: false });
        closeModal('task-modal');
    }
    else if (type === 'shop') {
        const desc = document.getElementById('shop-desc').value;
        if(!desc) return alert('Please enter an item');
        // Ensure data.shop exists for old users
        if(!data.shop) data.shop = [];
        data.shop.push({ id, desc, done: false });
        closeModal('shop-modal');
    }
    else if (type === 'schedule') {
        const title = document.getElementById('sched-title').value;
        const time = document.getElementById('sched-time').value;
        if(!title) return alert('Activity required');
        data.schedule.push({ id, title, time });
        data.schedule.sort((a,b) => (a.time || '').localeCompare(b.time || ''));
        closeModal('schedule-modal');
    }
    else if (type === 'notes') {
        const title = document.getElementById('note-title').value;
        const body = document.getElementById('note-body').value;
        if(!title) return alert('Title required');
        data.notes.push({ id, title, body, date: new Date().toLocaleDateString() });
        closeModal('note-modal');
    }

    saveToLocal();
}

// --- ROBUST DELETE FUNCTION ---
window.deleteItem = function(event, type, id) {
    // Stop event bubbling immediately
    if(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if(confirm('Are you sure you want to delete this?')) {
        // Ensure the array exists before filtering
        if(data[type]) {
            data[type] = data[type].filter(item => item.id !== id);
            saveToLocal();
        }
    }
    return false; // Prevent further action
}

window.toggleTask = function(id, type = 'tasks') {
    // Handle both tasks and shopping list checkboxes
    const list = type === 'shop' ? (data.shop || []) : data.tasks;
    const item = list.find(t => t.id === id);
    if(item) {
        item.done = !item.done;
        saveToLocal();
    }
}

// --- RENDERING ---
function renderAll() {
    renderMeds();
    renderContacts();
    renderTasks();
    renderSchedule();
    renderNotes();
    renderShop();
}

function renderMeds() {
    const container = document.getElementById('med-list');
    if(data.meds.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 mt-10 text-xl font-bold">No medications</div>';
        return;
    }
    container.innerHTML = data.meds.map(item => `
        <div class="bg-white p-5 rounded-2xl shadow-sm border-l-8 border-blue-500 flex justify-between items-center mb-4">
            <div>
                <h4 class="font-bold text-2xl text-gray-800">${item.name}</h4>
                <div class="text-blue-700 font-bold text-lg"><i class="far fa-clock mr-1"></i> ${item.time || 'Anytime'}</div>
                <div class="text-gray-600 text-lg">${item.desc}</div>
            </div>
            <button onclick="deleteItem(event, 'meds', '${item.id}')" class="bg-red-50 text-red-500 p-4 rounded-xl tap-effect border border-red-100"><i class="fas fa-trash-alt text-2xl"></i></button>
        </div>
    `).join('');
}

function renderContacts() {
    const container = document.getElementById('contact-list');
    if(data.contacts.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 mt-10 text-xl font-bold">No contacts</div>';
        return;
    }
    container.innerHTML = data.contacts.map(item => `
        <div class="flex gap-2 mb-4">
            <div onclick="startFakeCall('${item.name}', '${item.phone}')" class="flex-1 bg-white p-4 rounded-2xl shadow-sm flex items-center tap-effect border border-gray-100">
                <div class="bg-green-100 text-green-700 w-16 h-16 rounded-full flex items-center justify-center text-3xl mr-4 shrink-0">
                    <i class="fas fa-phone"></i>
                </div>
                <div>
                    <h4 class="font-bold text-2xl text-gray-800">${item.name}</h4>
                    <div class="text-gray-600 font-mono text-xl">${item.phone}</div>
                </div>
            </div>
            <button onclick="deleteItem(event, 'contacts', '${item.id}')" class="bg-red-100 text-red-600 w-20 rounded-2xl shadow-sm flex items-center justify-center tap-effect border border-red-200">
                <i class="fas fa-trash-alt text-2xl"></i>
            </button>
        </div>
    `).join('');
}

function renderTasks() {
    const container = document.getElementById('task-list');
    if(data.tasks.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 mt-10 text-xl font-bold">No tasks today</div>';
        return;
    }
    container.innerHTML = data.tasks.map(item => `
        <div class="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 transition-all ${item.done ? 'opacity-60 bg-gray-50' : ''} mb-3 border-l-8 ${item.done ? 'border-gray-300' : 'border-orange-500'}">
            <button onclick="toggleTask('${item.id}')" class="w-12 h-12 rounded-full border-4 ${item.done ? 'bg-orange-500 border-orange-500' : 'border-gray-300'} flex items-center justify-center shrink-0">
                ${item.done ? '<i class="fas fa-check text-white text-2xl"></i>' : ''}
            </button>
            <span class="flex-1 text-2xl font-bold ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}">${item.desc}</span>
            <button onclick="deleteItem(event, 'tasks', '${item.id}')" class="text-red-300 p-4 hover:text-red-500"><i class="fas fa-trash-alt text-2xl"></i></button>
        </div>
    `).join('');
}

function renderShop() {
    const container = document.getElementById('shop-list');
    if(!data.shop || data.shop.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 mt-10 text-xl font-bold">List is empty</div>';
        return;
    }
    container.innerHTML = data.shop.map(item => `
        <div class="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 transition-all ${item.done ? 'opacity-60 bg-gray-50' : ''} mb-3 border-l-8 ${item.done ? 'border-gray-300' : 'border-lime-500'}">
            <button onclick="toggleTask('${item.id}', 'shop')" class="w-12 h-12 rounded-full border-4 ${item.done ? 'bg-lime-500 border-lime-500' : 'border-gray-300'} flex items-center justify-center shrink-0">
                ${item.done ? '<i class="fas fa-check text-white text-2xl"></i>' : ''}
            </button>
            <span class="flex-1 text-2xl font-bold ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}">${item.desc}</span>
            <button onclick="deleteItem(event, 'shop', '${item.id}')" class="text-red-300 p-4 hover:text-red-500"><i class="fas fa-trash-alt text-2xl"></i></button>
        </div>
    `).join('');
}

function renderSchedule() {
    const container = document.getElementById('schedule-list');
    if(data.schedule.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 mt-10 text-xl font-bold">No routine added</div>';
        return;
    }
    container.innerHTML = data.schedule.map(item => `
        <div class="bg-white p-5 rounded-2xl shadow-sm border-l-8 border-indigo-500 flex justify-between items-center mb-3">
            <div>
                <div class="text-indigo-700 font-bold text-xl"><i class="far fa-clock mr-1"></i> ${item.time || 'Anytime'}</div>
                <h4 class="font-bold text-2xl text-gray-800">${item.title}</h4>
            </div>
            <button onclick="deleteItem(event, 'schedule', '${item.id}')" class="bg-red-50 text-red-500 p-4 rounded-xl tap-effect border border-red-100"><i class="fas fa-trash-alt text-2xl"></i></button>
        </div>
    `).join('');
}

function renderNotes() {
    const container = document.getElementById('note-list');
    if(data.notes.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 mt-10 text-xl font-bold">No entries yet</div>';
        return;
    }
    container.innerHTML = data.notes.map(item => `
        <div class="bg-yellow-50 p-6 rounded-2xl shadow-sm border-2 border-yellow-200 relative mb-4">
            <h4 class="font-bold text-2xl text-yellow-900 mb-2">${item.title}</h4>
            <p class="text-gray-800 whitespace-pre-wrap text-xl leading-relaxed font-medium">${item.body}</p>
            <div class="mt-4 flex justify-between items-end border-t-2 border-yellow-200 pt-2">
                <span class="text-yellow-700 font-bold text-sm">${item.date}</span>
                <button onclick="deleteItem(event, 'notes', '${item.id}')" class="text-red-400 hover:text-red-600 p-2"><i class="fas fa-trash-alt text-2xl"></i></button>
            </div>
        </div>
    `).join('');
}