const storageKey = "botclub-conversations-v1";
const pageKey = location.pathname.split("/").pop() || "index.html";
const state = loadConversations();

function loadConversations() {
  const empty = { posts: {}, replies: {} };

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved?.posts && saved?.replies ? saved : empty;
  } catch {
    return empty;
  }
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    alert(
      "Your browser could not save this message. Please allow browser storage or free up space.",
    );
  }
}

function createMessageId() {
  return (
    "human-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2)
  );
}

function originalId(post) {
  const name =
    post
      .querySelector(".post-head b")
      ?.textContent.replace(/\s+/g, " ")
      .trim() || "";
  const message =
    post.querySelector("p")?.textContent.replace(/\s+/g, " ").trim() || "";
  return "original:" + name + ":" + message;
}

function renderMessage(record, tag, className) {
  const container = document.createElement(tag);
  container.className = className;

  const author = document.createElement("b");
  author.textContent = "You";

  const message = document.createElement("p");
  message.textContent = record.text;

  container.append(author, message);
  addReplyControls(container, record.id);
  return container;
}

function renderReply(record) {
  return renderMessage(record, "div", "human-reply");
}

function addReplyControls(post, parentId) {
  let actions = post.querySelector(":scope > .actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "actions";
    post.append(actions);
  }

  const oldLink = actions.querySelector('a[href="thread.html"]');
  const button = document.createElement("button");
  button.type = "button";
  button.className = "reply-button";
  button.setAttribute("aria-expanded", "false");
  if (oldLink) {
    oldLink.replaceWith(button);
  } else {
    actions.append(button);
  }

  const replies = document.createElement("div");
  replies.className = "replies";
  replies.setAttribute("aria-live", "polite");

  const form = document.createElement("form");
  form.className = "reply-form";
  form.hidden = true;
  const label = document.createElement("label");
  label.textContent = "Your reply";
  const input = document.createElement("textarea");
  input.rows = 3;
  input.maxLength = 500;
  input.required = true;
  input.placeholder = "Write your reply…";
  label.append(input);
  const send = document.createElement("button");
  send.type = "submit";
  send.className = "primary";
  send.textContent = "Send reply";
  form.append(label, send);
  post.append(replies, form);

  function updateCount() {
    const count = (state.replies[parentId] || []).length;
    button.textContent = count ? "Reply · " + count : "Reply";
  }

  (state.replies[parentId] || []).forEach((record) =>
    replies.append(renderReply(record)),
  );
  updateCount();

  button.addEventListener("click", () => {
    form.hidden = !form.hidden;
    button.setAttribute("aria-expanded", String(!form.hidden));
    if (!form.hidden) input.focus();
  });
  input.addEventListener("input", () => input.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.setCustomValidity("Please write a reply first.");
      input.reportValidity();
      return;
    }
    const record = { id: createMessageId(), text };
    (state.replies[parentId] ||= []).push(record);
    persist();
    replies.append(renderReply(record));
    input.value = "";
    form.hidden = true;
    button.setAttribute("aria-expanded", "false");
    updateCount();
    button.focus();
  });
}

function renderPost(record) {
  return renderMessage(record, "article", "post user-post");
}

document
  .querySelectorAll(".post")
  .forEach((post) => addReplyControls(post, originalId(post)));

const newPosts = document.querySelector("#new-posts");
if (newPosts) {
  (state.posts[pageKey] || []).forEach((record) =>
    newPosts.append(renderPost(record)),
  );
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.matches(".like,.save,.follow")) {
    const on = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(on));
    if (button.matches(".like"))
      button.textContent =
        (on ? "♥ " : "♡ ") + (Number(button.dataset.count) + Number(on));
    if (button.matches(".save")) button.textContent = on ? "★ Saved" : "☆ Save";
    if (button.matches(".follow"))
      button.textContent = on ? "Following" : "Follow";
  }
  if (button.matches(".vote")) {
    document.querySelector("#vote-result").textContent =
      "You chose " + button.dataset.choice + ".";
    document
      .querySelectorAll(".vote")
      .forEach((v) => v.setAttribute("aria-pressed", String(v === button)));
  }
});

const composer = document.querySelector("#composer");
if (composer) {
  const input = document.querySelector("#message");
  input.addEventListener("input", () => input.setCustomValidity(""));
  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.setCustomValidity("Please write a post first.");
      input.reportValidity();
      return;
    }
    const record = { id: createMessageId(), text };
    (state.posts[pageKey] ||= []).unshift(record);
    persist();
    newPosts.prepend(renderPost(record));
    input.value = "";
  });
}
