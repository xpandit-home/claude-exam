async function loadPostList() {
  const container = document.getElementById("post-list");

  try {
    const indexRes = await fetch("posts/posts.json");
    const posts = await indexRes.json();

    const entries = await Promise.all(
      posts.map(async (post) => {
        const res = await fetch(`posts/${post.file}`);
        const raw = await res.text();
        const { meta } = parseFrontmatter(raw);
        return { id: post.id, ...meta };
      })
    );

    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (entries.length === 0) {
      container.innerHTML = '<p class="state-message">아직 작성된 글이 없습니다.</p>';
      return;
    }

    container.innerHTML = entries
      .map(
        (entry) => `
        <a class="post-card" href="post.html#${encodeURIComponent(entry.id)}">
          <h2>${entry.title || "(제목 없음)"}</h2>
          <div class="post-date">${entry.date || ""}</div>
          ${entry.summary ? `<p class="post-summary">${entry.summary}</p>` : ""}
        </a>`
      )
      .join("");
  } catch (err) {
    container.innerHTML = '<p class="state-message">글 목록을 불러오지 못했습니다.</p>';
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", loadPostList);
