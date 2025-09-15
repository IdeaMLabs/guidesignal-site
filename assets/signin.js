// Firebase sign-in using REST API
const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBJOVbMoHfdxHexsfqsbYsvFzFqaKBXC_s', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: email,
    password: pwd,
    returnSecureToken: true
  })
});

if (response.ok) {
  const result = await response.json();
  if (result.idToken) {
    localStorage.setItem('authToken', result.idToken);
  }
}
