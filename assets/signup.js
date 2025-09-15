// Firebase sign-up using REST API
const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBJOVbMoHfdxHexsfqsbYsvFzFqaKBXC_s', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
    returnSecureToken: true
  })
});

if (response.ok) {
  const result = await response.json();
  if (result.idToken) {
    localStorage.setItem('authToken', result.idToken);
  }
}
