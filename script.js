import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
let userId;
let userName;
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcixgwxGbBvBKWpVw0XJYzzhmeXpp3FBU",
  authDomain: "dubrizz.firebaseapp.com",
  projectId: "dubrizz",
  storageBucket: "dubrizz.appspot.com",
  messagingSenderId: "376279827690",
  appId: "1:376279827690:web:529761e9563dbab4200393",
  measurementId: "G-GTBN0VJ4GN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

// Set local persistence to keep user signed in across sessions
function signin() {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      return signInWithPopup(auth, provider);
    })
    .then((result) => {
      const user = result.user;
      userId = user.uid;
      userName = user.displayName;

      const userDiv = document.getElementById('user');
      const googleLoginBtn = document.getElementById('google-login-btn');
      googleLoginBtn.style.display = 'none';

      const userNameSpan = document.createElement('span');
      userNameSpan.textContent = userName;
      userDiv.replaceChildren(userNameSpan);



                 fetch('https://dubrizz-production.up.railway.app/register', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
      
                    uid: userId
                  }),
                })
                  .then(response => response.json())
                  .then(data => {
                    console.log('User added to Firestore:', data);
                  })
                  .catch(error => {
                    console.error('Error adding user to Firestore:', error);
                  });
            
   

      
    })
    .catch((error) => {
      console.error("Error signing in:", error);
    });
}

// Detect and display user on page load if they're already signed in
onAuthStateChanged(auth, (user) => {
  if (user) {
    userId = user.uid;
    userName = user.displayName;

    const userDiv = document.getElementById('user');
    const googleLoginBtn = document.getElementById('google-login-btn');
    googleLoginBtn.style.display = 'none';

    const userNameSpan = document.getElementById('username');
    userNameSpan.textContent = userName;
    //userDiv.appendChild(userNameSpan);
  }
});

// Event listener for the login button
const googleLogin = document.getElementById("google-login-btn");
googleLogin.addEventListener("click", function() {
  signin();
});



    /////////////////////////////////////////



//         function pausebtn(id, active) {
//
//             document.getElementById('respondButton').disabled = active;
//             document.getElementById('respondButton').span = "again";
//
//
//             const button = document.getElementById("respondButton");
//             const span = button.querySelector("span");
//
//             // Hide the span and add "loading..." text after it
//             span.style.display = "none";
//             button.append("loading...");
//
//         }


function fetchUserCredits(userId) {
  const url = `https://dubrizz-production.up.railway.app/credits?uid=${encodeURIComponent(userId)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.credits !== undefined) {

        document.getElementById("credits").textContent = `Credits remaining: ${data.credits}`
      } else {
        window.alert(`Error: ${data.error}`);
      }
    })
    .catch(error => {
      window.alert(`Error fetching credits: ${error.message}`);
    });
}





        const imgInput = document.getElementById('imageInput');
        imgInput.addEventListener('change', function(event) {
        if (userId === undefined) {
                console.error("User is not logged in.");
                signin();
            }


            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64String = e.target.result.split(',')[1]; // Get only the base64 part



                    fetch('https://dubrizz-production.up.railway.app/ss', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ base: base64String, id: userId })
                    })
                    .then(response => response.json())
                    .then(d => {
                      document.getElementById('inputField').value = d.choices[0].message.content
                        console.log('Success:', d);
                    })
                    .catch((error) => {
                        console.error('Error:', error);

                    });




                };
                reader.readAsDataURL(file);
            }

        });





        const respondButton = document.getElementById('respondButton');
        const inputField = document.getElementById('inputField');
        const responseContainer = document.getElementById('responseContainer');
        let responseState = "respond";

        respondButton.addEventListener('click', async () => {

            respondButton.textContent = "loading...";
            respondButton.style.backgroundColor = "lightgray"
            respondButton.disabled = true;

            if (userId === undefined) {
                console.error("User is not logged in.");
                signin();
                respondButton.disabled = false;
                respondButton.textContent = "again";
                respondButton.style.backgroundColor = "white"
            }


            const history = inputField.value.trim();

            if (history != "") {
                try {
                    const response = await fetch(`https://dubrizz-production.up.railway.app/rizz?history=${encodeURIComponent(history)}&id=${encodeURIComponent(userId)}`);



                    if (response.status === 401) {
                        console.error("User is not logged in.");
                        signin();

                    }

                    const data = await response.json();

                    const newResponse = document.createElement('div');
                    const obj = JSON.parse(data.response);


                    let content = "";
                    obj.responses.forEach(response => {
                      content += `<div class="response">${response}</div><br/>`;
                    });


                    if (obj.dont_respond) {
                      content = `<div class="shittest">Don't respond, she is being too dry</div><br/>`+content;
                    }

                    if (obj.she_taking_much_longer) {
                      content = `<div class="shittest">Wait at least one day before responding</div><br/>`+content;
                    }

                    if (obj.she_said_she_bad_texter) {
                      content = `<div class="shittest">Stop texting her, there is no such thing as a girl who's a 'bad texter'</div><br/>`+content;
                    }

                    if (obj.she_express_distaste) {
                      content = `<div class="shittest">Double-down, she is expressing distaste to see how you react</div><br/>`+content;
                    }




                    newResponse.innerHTML = content;





                    newResponse.classList.add('animate');
                    responseContainer.prepend(newResponse);



                    respondButton.disabled = false;
                    respondButton.textContent = "again";
                    respondButton.style.backgroundColor = "white"
                } catch (error) {
                    console.error('Error fetching the response:', error);



                    const fallbackResponse = document.createElement('div');

                    fallbackResponse.classList.add('animate');
                    responseContainer.prepend(fallbackResponse);
                    const newResponse = document.createElement('div');
                    newResponse.innerHTML = '<div class="error">Error! Rephrase and try again</div>';
                    newResponse.classList.add('animate');
                    responseContainer.prepend(newResponse);
                    respondButton.disabled = false;
                    respondButton.textContent = "again";
                    respondButton.style.backgroundColor = "white"







                }





               fetchUserCredits(userId);





              

                if (responseState === "respond") {
                  respondButton.textContent = "another";
                  responseState = "another";
                }
            }


        });

        inputField.addEventListener('input', () => {
            respondButton.textContent = "respond";
            responseState = "respond";
        });

