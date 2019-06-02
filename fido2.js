const register = () => {
  const email = $('#email').val();
  const displayname = $('#displayname').val();
  if (email === '' || displayname === '') {
    throw Error('empty data');
  }

  fetch('https://e711.csie.pccu.edu.tw:9000/v0/register/begin', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify({ email, displayname }),
  })
    .then((response) => {
      if (response.status !== 200) {
        throw Error(response.statusText || `${response.status} Error`);
      }
      return response.json();
    })
    .then((response) => {
      createCredential(response);
    })
    .catch((err) => {
      $('#register_result').html(
        `<pre class="error">${JSON.stringify(err.message)}</pre>`
      );
      $('#dateForm').hide();
    });
};

const createCredential = (data) => {
  data.publicKey.challenge = base64url.decode(
    base64url.fromBase64(data.publicKey.challenge)
  );
  data.publicKey.user.id = base64url.decode(
    base64url.fromBase64(data.publicKey.user.id)
  );

  navigator.credentials
    .create(data)
    .then((response) => {
      const data = publicKeyCredentialToJSON(response);
      sendRegisterResponse(data);
    })
    .catch((err) => {
      $('#register_result').html(
        `<pre class="error">${JSON.stringify(err.message)}</pre>`
      );
      $('#dateForm').hide();
    });
};

const publicKeyCredentialToJSON = (pubKeyCred) => {
  if (pubKeyCred instanceof Array) {
    let arr = [];
    for (let i of pubKeyCred) arr.push(publicKeyCredentialToJSON(i));

    return arr;
  }

  if (pubKeyCred instanceof ArrayBuffer) {
    return base64url.encode(pubKeyCred);
  }

  if (pubKeyCred instanceof Object) {
    let obj = {};

    for (let key in pubKeyCred) {
      obj[key] = publicKeyCredentialToJSON(pubKeyCred[key]);
    }

    return obj;
  }

  return pubKeyCred || '';
};

const sendRegisterResponse = (data) => {
  fetch('https://e711.csie.pccu.edu.tw:9000/v0/register/finish', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.status !== 200) {
        throw Error(response.statusText || `${response.status} Error`);
      }
      return response.json();
    })
    .then((response) => {
      $('#register_result').html(`<pre>${JSON.stringify(response)}</pre>`);
    })
    .catch((err) => {
      $('#register_result').html(
        `<pre class="error">${JSON.stringify(err.message)}</pre>`
      );
      $('#dateForm').hide();
    });
};

const login = () => {
  const email = $('#login_email').val();
  if (!email) {
    throw Error('empty data');
  }

  fetch('https://e711.csie.pccu.edu.tw:9000/v0/login/begin', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify({ email }),
  })
    .then((response) => {
      if (response.status !== 200) {
        throw Error(response.statusText || `${response.status} Error`);
      }
      return response.json();
    })
    .then((response) => {
      assertCredential(response);
    })
    .catch((err) => {
      $('#login_result').html(
        `<pre class="error">${JSON.stringify(err.message)}</pre>`
      );
      $('#dateForm').hide();
    });
};

const assertCredential = (data) => {
  data.publicKey.challenge = base64url.decode(
    base64url.fromBase64(data.publicKey.challenge)
  );

  for (let allowCred of data.publicKey.allowCredentials) {
    allowCred.id = base64url.decode(base64url.fromBase64(allowCred.id));
  }

  navigator.credentials
    .get(data)
    .then((response) => {
      const data = publicKeyCredentialToJSON(response);
      sendLoginResponse(data);
    })
    .catch((err) => {
      $('#login_result').html(
        `<pre class="error">${JSON.stringify(err.message)}</pre>`
      );
      $('#dateForm').hide();
    });
};

let seconds = 0;
let timeout;

const sendLoginResponse = (data) => {
  fetch('https://e711.csie.pccu.edu.tw:9000/v0/login/finish', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.status !== 200) {
        throw Error(response.statusText || `${response.status} Error`);
      }

      const token = response.headers.get('Authorization');
      if (!!token) {
        localStorage.setItem('token', token);
      } else {
        throw Error('no response token');
      }

      return response.json();
    })
    .then((response) => {
      if (response.email === $('#login_email').val()) {
        $('#dateForm').show();

        seconds = 0;
        clearTimeout(timeout);
        test();
      } else {
        throw Error('error');
      }
    })
    .catch((err) => {
      $('#login_result').html(
        `<pre class="error">${JSON.stringify(err.message)}</pre>`
      );
      $('#dateForm').hide();
    });
};

const test = () => {
  fetch('https://e711.csie.pccu.edu.tw:9000/v0/test', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Authorization: localStorage.getItem('token'),
      'Content-Type': 'application/json',
    },
    mode: 'cors',
  })
    .then((response) => {
      if (response.status !== 200) {
        throw Error(response.statusText || `${response.status} Error`);
      }

      if ($('#remember').prop('checked')) {
        const token = response.headers.get('Authorization');
        if (!!token) {
          localStorage.setItem('token', token);
        } else {
          throw Error('no response token');
        }
      }
      return response.json();
    })
    .then((response) => {
      seconds++;
      $('#login_result').html(
        `<pre>
Hello, ${response.displayname}
${seconds}. ${JSON.stringify(response)}
</pre>`
      );
      timeout = setTimeout(test, 1000);
    })
    .catch((err) => {
      $('#login_result').html(
        `<pre class="error">${JSON.stringify(err.message)}</pre>`
      );
      $('#dateForm').hide();
    });
};
