const subjects = ["전체", "과학과창의적사고", "네트워크최신기술", "인공지능보안", "정보통신과현대생활", "정보보안기사"];

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
}

// 과목 목록 가져오기
async function fetchSubjects() {
  const res = await fetch('/api/subjects');
  return await res.json();
}

// 과목 추가하기
async function addSubject(newSubject) {
  const res = await fetch('/api/subjects', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name: newSubject})
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return await res.text();
}

// 게시글 목록/상세/작성/수정/삭제 관련 함수
async function fetchPosts(subject = "") {
  const url = subject && subject !== "전체" ? `/api/posts?subject=${encodeURIComponent(subject)}` : "/api/posts";
  const res = await fetch(url, {
    credentials: 'include'
  });
  if (!res.ok) {
    console.error('게시글 목록을 불러오는데 실패했습니다.');
    return [];
  }
  return await res.json();
}

async function fetchPostDetail(id) {
  try {
    const res = await fetch(`/api/posts/${id}`, {
      credentials: 'include'
    });
    if (!res.ok) {
      console.error(`API 오류: ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('게시글 상세 정보 요청 중 오류:', error);
    return null;
  }
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
  const res = await fetch(`/api/posts/${id}`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    credentials: 'include',
    body: JSON.stringify({title, content, subject})
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "글 수정에 실패했습니다.");
  }
  return await res.json();
}

async function deletePost(id) {
  const res = await fetch(`/api/posts/${id}`, {
    method: "DELETE",
    credentials: 'include'
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "글 삭제에 실패했습니다.");
  }
  return await res.json();
}

// 과목 필터 렌더링
async function renderSubjectFilter(selected = "전체") {
  const subjects = await fetchSubjects();
  return `
    <select id="subjectFilter">
      <option value="전체" ${selected === "전체" ? "selected" : ""}>전체</option>
      ${subjects.map(s => `<option value="${s}" ${selected === s ? "selected" : ""}>${s}</option>`).join('')}
    </select>
  `;
}

// 게시글 목록 렌더링
async function renderPostList(posts, subject = "전체") {
  const filterHtml = await renderSubjectFilter(subject);

  if (!posts || posts.length === 0) {
    return `
      <div style="margin-bottom:24px;">
        ${filterHtml}
      </div>
      <div style="color:#888;">게시글이 없습니다.</div>
    `;
  }

  return `
    <div style="margin-bottom:24px;">
      ${filterHtml}
    </div>
    <div class="post-list">
      ${posts.map(post => `
        <div class="post-card" data-id="${post.id}" onclick="showPostDetail(${post.id})" style="cursor:pointer; margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 4px;">
          <div class="post-title" style="font-weight: bold; font-size: 1.2rem; margin-bottom: 0.5rem;">
            ${post.title}
          </div>
          <div class="post-meta" style="color: #666; font-size: 0.9rem;">
            ${post.subject} | ${post.author ? post.author.username : '익명'} | ${formatDate(post.createdAt)}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// 게시글 목록 보여주기
async function showPostList(selectedSubject = "전체", pushState = true) {
  const main = document.getElementById("mainContainer");
  if (!main) return;

  try {
    main.innerHTML = '<div class="loading">로딩 중...</div>';
    const posts = await fetchPosts(selectedSubject);
    main.innerHTML = await renderPostList(posts, selectedSubject);

    // 과목 필터 변경 이벤트 바인딩
    const filter = document.getElementById("subjectFilter");
    if (filter) {
      filter.addEventListener("change", (e) => {
        showPostList(e.target.value, true);
      });
    }

    if (pushState) {
      history.pushState({}, '', selectedSubject === "전체" ? '/' : `/?subject=${encodeURIComponent(selectedSubject)}`);
    }
  } catch (error) {
    console.error('게시글 목록을 불러오는 중 오류 발생:', error);
    main.innerHTML = '<div class="error">게시글을 불러오는 중 오류가 발생했습니다.</div>';
  }
}

// 마크다운을 HTML로 변환하는 함수
function renderMarkdown(content) {
    if (!content) return '';

    // marked 라이브러리 설정
    marked.setOptions({
        highlight: function(code, lang) {
            if (Prism.languages[lang]) {
                return Prism.highlight(code, Prism.languages[lang], lang);
            }
            return code;
        },
        breaks: true,
        gfm: true
    });

    return marked.parse(content);
}

// 게시글 상세 보기 + 수정/삭제/목록 버튼
async function showPostDetail(id, pushState=true) {
  const main = document.getElementById("mainContainer");
  if (!main) return;

  try {
    main.innerHTML = '<div class="loading">로딩 중...</div>';
    const post = await fetchPostDetail(id);
    if (!post) {
      main.innerHTML = `<div style="color:red;">게시글을 불러올 수 없습니다.</div>`;
      return;
    }

    const title = post.title;
    const subject = post.subject;
    const createdAt = post.createdAt;
    const content = post.content;
    const authorName = post.author?.username || "알 수 없음";
    const isAuthor = post.isAuthor; // ← 백엔드에서 내려준 값 사용

//    const htmlContent = marked.parse(content);
    const contentHtml = renderMarkdown(post.content); // 마크다운 변환

    main.innerHTML = `
    <div class="post-detail">
      <h2>${title}</h2>
      <div class="post-meta">${subject} | ${formatDate(createdAt)} | 작성자: ${authorName}</div>
      <div class="post-content">${contentHtml}</div>
      <button id="editBtn" class="btn">수정</button>
      <button id="deleteBtn" class="btn" style="margin-left:8px;">삭제</button>
      <button id="backBtn" class="btn" style="margin-left:8px;">목록으로</button>
    </div>
  `;
    document.getElementById("backBtn").addEventListener("click", () => showPostList());
    document.getElementById("editBtn").addEventListener("click", async () => {
      if (isAuthor) {
        showEditForm(post);
      } else {
        alert("작성자만 게시글을 수정할 수 있습니다.");
      }
    });
    document.getElementById("deleteBtn").addEventListener("click", async () => {
      if (isAuthor) {
        if (confirm("정말 삭제하시겠습니까?")) {
          try {
            await deletePost(id);
            alert("삭제되었습니다.");
            showPostList("전체");
          } catch (e) {
            alert(e.message || "삭제 실패");
          }
        }
      } else {
        alert("작성자만 게시글을 삭제할 수 있습니다.");
      }
    });
    if (pushState) history.pushState({}, '', `/post/${id}`);
  } catch (error) {
    console.error('게시글 상세 정보를 불러오는 중 오류 발생:', error);
    main.innerHTML = `<div style="color:red;">게시글을 불러올 수 없습니다. 오류: ${error.message}</div>`;
  }
}
window.showPostDetail = showPostDetail;

// 글 작성 폼
async function showWriteForm(pushState = true) {
  const main = document.getElementById("mainContainer");
  if (!main) return;
  let subjects = await fetchSubjects();

  main.innerHTML = `
    <div class="write-form">
      <div class="write-form-title">글 작성</div>
      <form id="writeForm">
        <label for="subject">과목</label>
        <div style="display:flex; gap:8px;">
          <select id="subject" name="subject" required>
            ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>
        <div style="margin: 8px 0;">
            <input type="text" id="newSubjectInput" placeholder="새 과목 입력 후 추가 버튼 클릭">
            <button type="button" id="addSubjectBtn">과목 추가</button>
        </div>
        <label for="title">제목</label>
        <input type="text" id="title" name="title" required>
        <label for="content">내용</label>
        <textarea id="content" name="content" required></textarea>
        <button type="submit" class="submit-btn">작성하기</button>
        <button type="button" id="cancelWriteBtn" class="btn" style="margin-left:8px;">취소</button>
        <div id="writeError" style="color:red; margin-top:10px;"></div>
      </form>
    </div>
  `;

  // 새 과목 추가 버튼 이벤트
    document.getElementById("addSubjectBtn").onclick = async () => {
      const newSubject = document.getElementById("newSubjectInput").value.trim();
      if (newSubject) {
        try {
          await addSubject(newSubject);
          alert("과목이 추가되었습니다.");
          subjects = await fetchSubjects();
          const select = document.getElementById("subject");
          select.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
          select.value = newSubject;
          document.getElementById("newSubjectInput").value = "";
        } catch (e) {
          alert(e.message);
        }
      } else {
        alert("새 과목명을 입력하세요.");
      }
    };

  // 폼 제청 이벤트 리스너 추가
  document.getElementById("writeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const subject = document.getElementById("subject").value;
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const errorElement = document.getElementById("writeError");
    try {
      errorElement.textContent = '';
      await createPost({ title, content, subject });
      showPostList();
    } catch (error) {
      errorElement.textContent = error.message || '글 작성 중 오류가 발생했습니다.';
    }
  });

  document.getElementById("cancelWriteBtn").onclick = () => showPostList();

  if (pushState) {
    history.pushState({}, '', '/write');
  }
}

// 글 수정 폼
async function showEditForm(post) {
  const main = document.getElementById("mainContainer");
  if (!main) return;
  let subjects = await fetchSubjects();

  main.innerHTML = `
    <div class="write-form">
      <div class="write-form-title">글 수정</div>
      <form id="editForm">
        <label for="subject">과목</label>
        <div style="display:flex; gap:8px;">
          <select id="subject" name="subject" required>
            ${subjects.map(s => `<option value="${s}" ${s === post.subject ? "selected" : ""}>${s}</option>`).join('')}
          </select>
        </div>
        <div style="margin: 8px 0;">
            <input type="text" id="newSubjectInput" placeholder="새 과목 입력 후 추가 버튼 클릭">
            <button type="button" id="addSubjectBtn">과목 추가</button>
        </div>
        <label for="title">제목</label>
        <input type="text" id="title" name="title" required value="${post.title}">
        <label for="content">내용</label>
        <textarea id="content" name="content" required>${post.content}</textarea>
        <button type="submit" class="submit-btn">수정하기</button>
        <button type="button" id="cancelEditBtn" class="btn" style="margin-left:8px;">취소</button>
        <div id="editError" style="color:red; margin-top:10px;"></div>
      </form>
    </div>
  `;

  // 새 과목 추가 버튼 이벤트
    document.getElementById("addSubjectBtn").onclick = async () => {
      const newSubject = document.getElementById("newSubjectInput").value.trim();
      if (newSubject) {
        try {
          await addSubject(newSubject);
          alert("과목이 추가되었습니다.");
          subjects = await fetchSubjects();
          const select = document.getElementById("subject");
          select.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
          select.value = newSubject;
          document.getElementById("newSubjectInput").value = "";
        } catch (e) {
          alert(e.message);
        }
      } else {
        alert("새 과목명을 입력하세요.");
      }
    };

  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const subject = document.getElementById("subject").value;
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const errorElement = document.getElementById("editError");
    try {
      errorElement.textContent = '';
      await updatePost(post.id, { title, content, subject });
      alert("수정되었습니다.");
      showPostDetail(post.id);
    } catch (err) {
      errorElement.textContent = err.message || "수정 실패";
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