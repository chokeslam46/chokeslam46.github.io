const register = () => {
  const email = $('#email').val();
  const displayname = $('#displayname').val();
  if (email === '' || displayname === '') {
    throw Error('empty data');
  }

  fetch('https://r02921049.ddns.net:9000/v0/register/begin', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    body: JSON.stringify({ email, displayname }),
  })
  .then((response) => {
    if (response.status !== 200) {
      throw Error(response.statusText);
    }
    return response.json();
  })
  .then((response) => {
    createCredential(response);
  })
  .catch(console.error);
};

const createCredential = (data) => {
  data.publicKey.challenge = base64url.decode(
    base64url.fromBase64(data.publicKey.challenge)
  );
  data.publicKey.user.id = base64url.decode(
    base64url.fromBase64(data.publicKey.user.id)
  );

  navigator.credentials.create(data).then((response) => {
    const data = publicKeyCredentialToJSON(response);
    sendRegisterResponse(data);
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

  return pubKeyCred || "";
};

const sendRegisterResponse = (data) => {
  fetch('https://r02921049.ddns.net:9000/v0/register/finish', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    body: JSON.stringify(data),
  })
  .then((response) => {
    if (response.status !== 200) {
      throw Error(response.statusText);
    }
    return response.json();
  })
  .then((response) => {
    console.log(response);
  })
  .catch(console.error);
};

const login = () => {
  const email = $('#login_email').val();
  if (!email) {
    throw Error('empty data');
  }

  fetch('https://r02921049.ddns.net:9000/v0/login/begin', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    body: JSON.stringify({ email }),
  })
  .then((response) => {
    if (response.status !== 200) {
      throw Error(response.statusText);
    }
    return response.json();
  })
  .then((response) => {
    assertCredential(response);
  })
  .catch(console.error);
};

const assertCredential = (data) => {
  data.publicKey.challenge = base64url.decode(
    base64url.fromBase64(data.publicKey.challenge)
  );

  for (let allowCred of data.publicKey.allowCredentials) {
    allowCred.id = base64url.decode(base64url.fromBase64(allowCred.id));
  }

  navigator.credentials.get(data).then((response) => {
    const data = publicKeyCredentialToJSON(response);
    sendLoginResponse(data);
  });
};

let seconds = 0;

const sendLoginResponse = (data) => {
  fetch('https://r02921049.ddns.net:9000/v0/login/finish', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    body: JSON.stringify(data),
  })
  .then((response) => {
    if (response.status !== 200) {
      throw Error(response.statusText);
    }

    const token = response.headers.get('Authorization');
    if (!!token) {
      localStorage.setItem('token', token);
    } else {
      throw Error('no response token');
    }
    
    
    return response.json()
  })
  .then((response) => {
    if (response.email === $('#login_email').val()) {
      $('#dateForm').show();

      seconds = 0;
      test();
    } else {
      throw Error('error');
    }
  })
  .catch(console.error);
};

const test = () => {
  fetch('https://r02921049.ddns.net:9000/v0/test', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Authorization': localStorage.getItem('token'),
      'Content-Type': 'application/json'
    },
    mode: 'cors',
  })
  .then((response) => {
    if (response.status !== 200) {
      throw Error(response.statusText);
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
    $('#login_result').html(`<pre>
      Hello, ${response.displayname}
      ${seconds}. ${JSON.stringify(response)}
    </pre>`);
    setTimeout(test, 1000);
  })
  .catch((err) => {
    $('#login_result').html(`<font colo="red"><pre>${JSON.stringify(err.message)}</pre></font>`);
    $('#dateForm').hide();
  });
}
