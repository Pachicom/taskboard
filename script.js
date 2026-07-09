async function loadTasks() {
  const res = await fetch("http://127.0.0.1:5000/tasks");
  const tasks = await res.json();

  document.querySelectorAll(".tasks").forEach(el => el.innerHTML = "");

  const counters = { todo: 0, inprogress: 0, done: 0 };

  tasks.forEach(task => {
    counters[task.status]++;

    const div = document.createElement("div");
    div.className = "task";
    div.draggable = true;

    div.addEventListener("dragstart", e => {
      e.dataTransfer.setData("id", task.id);
    });

    const span = document.createElement("span");
    span.textContent = task.title;
    span.addEventListener("dblclick", () => {
      const input = document.createElement("input");
      input.value = task.title;
      input.addEventListener("blur", async () => {
        await fetch(`http://127.0.0.1:5000/tasks/${task.id}`, {
          method: "PUT",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({title: input.value, status: task.status})
        });
        loadTasks();
      });
      input.addEventListener("keydown", e => {
        if (e.key === "Enter") input.blur();
      });
      div.replaceChild(input, span);
      input.focus();
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "✖";
    delBtn.addEventListener("click", async () => {
      div.style.transform = "scale(0.8)";
      div.style.opacity = "0";
      setTimeout(async () => {
        await fetch(`http://127.0.0.1:5000/tasks/${task.id}`, { method: "DELETE" });
        loadTasks();
      }, 300);
    });

    div.appendChild(span);
    div.appendChild(delBtn);
    div.style.animation = "fadeInUp 0.4s ease"; // анимация появления
    document.querySelector(`[data-status="${task.status}"] .tasks`).appendChild(div);
  });

  document.querySelector('[data-status="todo"] h2').textContent = `To Do (${counters.todo})`;
  document.querySelector('[data-status="inprogress"] h2').textContent = `In Progress (${counters.inprogress})`;
  document.querySelector('[data-status="done"] h2').textContent = `Done (${counters.done})`;
}

async function addTask() {
  const title = document.getElementById("newTask").value;
  if (!title) return;
  await fetch("http://127.0.0.1:5000/tasks", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({title})
  });
  document.getElementById("newTask").value = "";
  loadTasks();
}

document.querySelectorAll(".column").forEach(col => {
  col.addEventListener("dragover", e => e.preventDefault());
  col.addEventListener("drop", async e => {
    const id = e.dataTransfer.getData("id");
    await fetch(`http://127.0.0.1:5000/tasks/${id}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({status: col.dataset.status})
    });
    loadTasks();
  });
});

const themeBtn = document.getElementById("toggleTheme");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

const translations = {
  en: { 
    todo: "To Do", 
    inprogress: "In Progress", 
    done: "Done", 
    add: "Add Task", 
    input: "New task", 
    theme: "🌙 Dark Theme", 
    lang: "🌐 Change Language" 
  },
  ru: { 
    todo: "Надо сделать", 
    inprogress: "В процессе", 
    done: "Сделано", 
    add: "Добавить задачу", 
    input: "Новая задача", 
    theme: "🌙 Тёмная тема", 
    lang: "🌐 Сменить язык" 
  }
};

let currentLang = localStorage.getItem("lang") || "ru";

function updateLanguage() {
  document.querySelector('[data-status="todo"] h2').textContent = translations[currentLang].todo;
  document.querySelector('[data-status="inprogress"] h2').textContent = translations[currentLang].inprogress;
  document.querySelector('[data-status="done"] h2').textContent = translations[currentLang].done;
  document.querySelector("button[onclick='addTask()']").textContent = translations[currentLang].add;
  document.getElementById("newTask").placeholder = translations[currentLang].input;
  document.getElementById("toggleTheme").textContent = translations[currentLang].theme;
  document.getElementById("toggleLang").textContent = translations[currentLang].lang;
}

document.getElementById("toggleLang").addEventListener("click", () => {
  currentLang = currentLang === "ru" ? "en" : "ru";
  localStorage.setItem("lang", currentLang);
  updateLanguage();
});

updateLanguage();

loadTasks();
