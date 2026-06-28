async function loadPost() {
  const container = document.getElementById("post-content");
  const id = window.location.hash.slice(1);

  if (!id) {
    container.innerHTML = '<p class="state-message">글을 찾을 수 없습니다.</p>';
    return;
  }

  try {
    const indexRes = await fetch("posts/posts.json");
    const posts = await indexRes.json();
    const post = posts.find((p) => p.id === id);

    if (!post) {
      container.innerHTML = '<p class="state-message">글을 찾을 수 없습니다.</p>';
      return;
    }

    const res = await fetch(`posts/${post.file}`);
    const raw = await res.text();
    const { meta, body } = parseFrontmatter(raw);

    document.title = meta.title ? `${meta.title} - Blog` : "Blog";

    container.innerHTML = `
      <header>
        <h1>${meta.title || "(제목 없음)"}</h1>
        <div class="post-date">${meta.date || ""}</div>
      </header>
      ${renderMarkdown(body)}
    `;
  } catch (err) {
    container.innerHTML = '<p class="state-message">글을 불러오지 못했습니다.</p>';
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", loadPost);
