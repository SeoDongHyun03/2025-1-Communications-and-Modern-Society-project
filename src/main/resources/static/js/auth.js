// 로그인 폼 제출 처리
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = 'red';

    // 기존 에러 메시지 제거
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && !data.error) {
            // 로그인 성공 시 메인 페이지로 리다이렉트
            window.location.href = '/';
            // 로그인 성공 이벤트 발생
            window.dispatchEvent(new Event('loginSuccess'));
        } else {
            // 에러 메시지 표시
            errorElement.textContent = data.error || '로그인에 실패했습니다.';
            document.querySelector('.form-actions').before(errorElement);
        }
    } catch (error) {
        console.error('로그인 요청 중 오류 발생:', error);
        errorElement.textContent = '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.';
        document.querySelector('.form-actions').before(errorElement);
    }
});

// 회원가입 폼 제출 처리
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.style.color = 'red';

    // 기존 에러 메시지 제거
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    // 비밀번호 확인
    if (password !== confirmPassword) {
        errorElement.textContent = '비밀번호가 일치하지 않습니다.';
        document.querySelector('.form-actions').before(errorElement);
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && !data.error) {
            // 회원가입 성공 시 로그인 페이지로 리다이렉트
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            window.location.href = '/login.html';
        } else {
            // 에러 메시지 표시
            errorElement.textContent = data.error || '회원가입에 실패했습니다.';
            document.querySelector('.form-actions').before(errorElement);
        }
    } catch (error) {
        console.error('회원가입 요청 중 오류 발생:', error);
        errorElement.textContent = '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.';
        document.querySelector('.form-actions').before(errorElement);
    }
});

// 로그아웃 처리
document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'logoutBtn') {
        e.preventDefault();

        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });

            if (response.ok) {
                // 로그아웃 성공 시 메인 페이지로 리다이렉트
                window.location.href = '/';
            } else {
                console.error('로그아웃 실패');
            }
        } catch (error) {
            console.error('로그아웃 요청 중 오류 발생:', error);
        }
    }
});

// 페이지 로드 시 로그인 상태 확인
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/me');
        const data = await response.json();

        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const userGreeting = document.getElementById('userGreeting');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const writeLink = document.getElementById('writeLink');

        if (data.isLoggedIn) {
            // 로그인 상태
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (userGreeting) userGreeting.style.display = 'inline-block';
            if (usernameDisplay) usernameDisplay.textContent = data.username;
            if (writeLink) writeLink.style.display = 'inline-block';
        } else {
            // 로그아웃 상태
            if (loginLink) loginLink.style.display = 'inline-block';
            if (registerLink) registerLink.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userGreeting) userGreeting.style.display = 'none';
            if (writeLink) writeLink.style.display = 'none';
        }
    } catch (error) {
        console.error('로그인 상태 확인 중 오류 발생:', error);
    }
}

// 페이지 로드 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', checkLoginStatus);

// 로그인 성공 시에도 상태 업데이트
window.addEventListener('loginSuccess', checkLoginStatus);