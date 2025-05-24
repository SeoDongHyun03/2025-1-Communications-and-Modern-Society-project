const subjects = ["전체", "과학과창의적사고", "네트워크최신기술", "인공지능보안", "정보통신과현대생활", "정보보안기사"];

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
}

// 과목 목록 가져오기
async function fetchSubjects() {
  const res = await fetch('/subjects');
  return await res.json();
}

// 과목 추가
async function addSubject(name) {
  const res = await fetch('/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('과목 추가 실패');
  return await res.json();
}

// 게시글 목록/상세/작성/수정/삭제 관련 함수
async function fetchPosts(subject = "") {
  const url = subject && subject !== "전체" ? `/posts?subject=${encodeURIComponent(subject)}` : "/posts";
  const res = await fetch(url);
  if (!res.ok) return [];
  return await res.json();
}

async function fetchPostDetail(id) {
  const res = await fetch(`/posts/${id}`);
  if (!res.ok) return null;
  return await res.json();
}

async function createPost({title, content, subject}) {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: 'include',
    body: JSON.stringify({title, content, subject})
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "글 작성에 실패했습니다.");
  }
  return await res.json();
}

async function updatePost(id, {title, content, subject}) {
  const res = await fetch(`/posts/${id}`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({title, content, subject})
  });
  if (!res.ok) throw new Error("글 수정에 실패했습니다.");
  return await res.json();
}

async function deletePost(id) {
  const res = await fetch(`/posts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("글 삭제에 실패했습니다.");
}

// 과목 필터 렌더링 (동적)
async function renderSubjectFilter(selected = "전체") {
  const subjects = await fetchSubjects();
  const options = [
    `<option value="전체" ${selected === "전체" ? "selected" : ""}>전체</option>`,
    ...subjects.map(s => `<option value="${s.name}" ${selected === s.name ? "selected" : ""}>${s.name}</option>`)
  ].join("");
  return `<select id="subjectFilter" class="subject-filter">${options}</select>`;
}

// 게시글 목록 렌더링
async function renderPostList(posts, subject = "전체") {
  const filterHtml = await renderSubjectFilter(subject);
  return `
    <div style="margin-bottom:24px;">
      ${filterHtml}
    </div>
    ${posts.length === 0 ? `<div style="color:#888;">게시글이 없습니다.</div>` : ""}
    ${posts.map(post => `
      <div class="post-card" data-id="${post.id}" style="cursor:pointer;">
        <div class="post-title">${post.title}</div>
        <div class="post-meta">${post.subject} | ${formatDate(post.createdAt)}</div>
      </div>
    `).join("")}
  `;
}

// 게시글 목록 보여주기
async function showPostList(selectedSubject = "전체", pushState=true) {
  const main = document.getElementById("mainContainer");
  if (!main) return;
  const posts = await fetchPosts(selectedSubject);
  main.innerHTML = await renderPostList(posts, selectedSubject);

  const filter = document.getElementById("subjectFilter");
  if (filter) {
    filter.addEventListener("change", (e) => {
      showPostList(e.target.value);
    });
  }

  document.querySelectorAll(".post-card").forEach(card => {
    card.addEventListener("click", async () => {
      const id = card.dataset.id;
      showPostDetail(id);
    });
  });

  if (pushState) history.pushState({}, '', '/list');
}

// 게시글 상세 보기 + 수정/삭제/목록 버튼
async function showPostDetail(id, pushState=true) {
  const main = document.getElementById("mainContainer");
  if (!main) return;
  const post = await fetchPostDetail(id);
  if (!post) {
    main.innerHTML = `<div style="color:red;">게시글을 불러올 수 없습니다.</div>`;
    return;
  }
  main.innerHTML = `
  <div class="post-detail">
    <h2>${post.post.title}</h2>
    <div class="post-meta">${post.post.subject} | ${formatDate(post.post.createdAt)}</div>
    <div class="post-content">${post.htmlContent}</div>
    <button id="editBtn" class="btn">수정</button>
    <button id="deleteBtn" class="btn" style="margin-left:8px;">삭제</button>
    <button id="backBtn" class="btn" style="margin-left:8px;">목록으로</button>
  </div>
`;
  document.getElementById("backBtn").addEventListener("click", () => showPostList());
  document.getElementById("editBtn").addEventListener("click", () => showEditForm(post.post));
  document.getElementById("deleteBtn").addEventListener("click", async () => {
    if (confirm("정말 삭제하시겠습니까?")) {
      try {
        await deletePost(id);
        alert("삭제되었습니다.");
        showPostList("전체");
      } catch (e) {
        alert("삭제 실패");
      }
    }
  });
  if (pushState) history.pushState({}, '', `/post/${id}`);
}

// 글쓰기 폼 렌더링
async function showWriteForm(pushState = true) {
  const main = document.getElementById("mainContainer");
  if (!main) return;

  const subjects = await fetchSubjects();
  main.innerHTML = `
    <div class="write-form">
      <h2>새 글 작성</h2>
      <div id="errorMessage" style="color: red; margin-bottom: 1rem;"></div>
      <form id="writeForm">
        <div class="form-group">
          <label for="subject">과목</label>
          <select id="subject" name="subject" class="form-control" required>
            <option value="" disabled selected>과목을 선택하세요</option>
            ${subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="title">제목</label>
          <input type="text" id="title" name="title" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="content">내용</label>
          <textarea id="content" name="content" class="form-control" rows="10" required></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">작성 완료</button>
          <button type="button" class="btn btn-secondary" onclick="showPostList()">취소</button>
        </div>
      </form>
    </div>
  `;

  // 폼 제청 이벤트 리스너 추가
  document.getElementById("writeForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const subject = document.getElementById("subject").value;
    const errorElement = document.getElementById("errorMessage");

    try {
      errorElement.textContent = ''; // 이전 에러 메시지 지우기
      await createPost({ title, content, subject });
      showPostList(); // 성공 시 글 목록으로 이동
    } catch (error) {
      console.error('글 작성 오류:', error);
      errorElement.textContent = error.message || '글 작성 중 오류가 발생했습니다.';
    }
  });

  if (pushState) {
    history.pushState({}, '', '/write');
  }
}

// 글 수정 폼 렌더링 및 보여주기
async function showEditForm(post) {
  const main = document.getElementById("mainContainer");
  if (!main) return;
  const subjects = await fetchSubjects();
  main.innerHTML = `
    <div class="write-form">
      <div class="write-form-title">글 수정</div>
      <form id="editForm">
        <label for="subject">과목</label>
        <select id="subject" name="subject" required>
          ${subjects.map(s => `<option value="${s.name}" ${s.name === post.subject ? "selected" : ""}>${s.name}</option>`).join('')}
        </select>
        <label for="title">제목</label>
        <input type="text" id="title" name="title" required value="${post.title}">
        <label for="content">내용</label>
        <textarea id="content" name="content" required>${post.content}</textarea>
        <button type="submit" class="submit-btn">수정하기</button>
        <button type="button" id="cancelEditBtn" class="btn" style="margin-left:8px;">취소</button>
      </form>
    </div>
  `;

  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const subject = document.getElementById("subject").value;
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    try {
      await updatePost(post.id, {title, content, subject});
      alert("수정되었습니다.");
      showPostDetail(post.id);
    } catch (err) {
      alert("수정 실패");
    }
  });

  document.getElementById("cancelEditBtn").onclick = () => showPostDetail(post.id);
}

// SPA 라우팅 함수
function route(path) {
  if (path === "/write") {
    showWriteForm(false);
  } else if (path === "/list" || path === "/") {
    showPostList("전체", false);
  } else if (path.startsWith("/post/")) {
    const id = path.split("/post/")[1];
    showPostDetail(id, false);
  } else {
    showPostList("전체", false);
  }
}

// 네비게이션 이벤트 및 초기화
document.addEventListener("DOMContentLoaded", () => {
  const postListLink = document.getElementById("postListLink");
  if (postListLink) {
    postListLink.addEventListener("click", (e) => {
      e.preventDefault();
      route("/list");
      history.pushState({}, '', '/list');
    });
  }
  const writeLink = document.getElementById("writeLink");
  if (writeLink) {
    writeLink.addEventListener("click", (e) => {
      e.preventDefault();
      route("/write");
      history.pushState({}, '', '/write');
    });
  }
  route(location.pathname);
});

// 뒤로가기/앞으로가기 대응
window.addEventListener('popstate', () => {
  route(location.pathname);
});

document.getElementById('loginForm').onsubmit = async function(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const res = await fetch('/api/login', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  });
  const data = await res.json();
  if (data.username) {
    closeLoginModal();
    location.reload();
  } else {
    document.getElementById('loginError').innerText = data.error || "로그인 실패";
  }
};

document.getElementById('registerForm').onsubmit = async function(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const res = await fetch('/api/register', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  });
  const data = await res.json();
  if (data.result === "ok") {
    closeRegisterModal();
    alert("회원가입 성공! 로그인 해주세요.");
  } else {
    document.getElementById('registerError').innerText = data.error || "회원가입 실패";
  }
};