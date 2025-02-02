import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
window.userId = undefined;
window.character = "nonchalant";
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




window.copyText = function(button) {
  const textToCopy = button.innerText;

  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      window.alert("copied '"+textToCopy+"'");
    })
    .catch(err => {
      console.error("Failed to copy text: ", err);
    });
};








function displaypaymentlink(email){
  paylink = document.getElementById("paylink");
  paylink.style.display = "block";
  paylink.href = "https://buy.stripe.com/cN2aHD67QbNweT6aEE?prefilled_email=" + email;


}

// Set local persistence to keep user signed in across sessions
function signin() {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      return signInWithPopup(auth, provider);
    })
    .then((result) => {
      const user = result.user;
      window.userId = user.uid;
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
      
                    uid: window.userId
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
    window.userId = user.uid;
    userName = user.displayName;

    const userDiv = document.getElementById('user');
    const googleLoginBtn = document.getElementById('google-login-btn');
    googleLoginBtn.style.display = 'none';

    const userNameSpan = document.getElementById('username');
    userNameSpan.innerHTML = `<b>hey `+userName.split(" ")[0]+`!</b>`;// + `<br/><a href="privacy.md" style="font-size: 0.7em; color: lightgray">Privacy Policy</a>`;

    displaypaymentlink(user.email);

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
        if(data.credits == 0){
          document.getElementById("credits").innerHTML = `u ran out of credits, get more with <a href="`+document.getElementById("paylink").href+`">pro</a>`
        }
        else {
          document.getElementById("credits").innerHTML = `credits remaining: <b>${data.credits}</b>`
        }
      } else {
        window.alert(`Error: ${data.error}`);
      }
    })
    .catch(error => {
      window.alert(`Error fetching credits: ${error.message}`);
    });
}





  const imgInput = document.getElementById('imageInput');
  const imgLabel = document.getElementById('imglabel');
imgLabel.addEventListener('click', () => {
  imgLabel.textContent = "loading...";
  imgLabel.style.backgroundColor = "lightgray";
  imgLabel.style.pointerEvents = "none"; // Prevent further clicks
});

// Handle the file selection
imgInput.addEventListener('change', function(event) {



            if (window.userId === undefined) {
                console.error("User is not logged in.");
                signin();
                imgLabel.textContent = "📷 upload screenshot of chat or profile";
          imgLabel.style.backgroundColor = "white";
          imgLabel.style.pointerEvents = "auto";
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
        body: JSON.stringify({ base: base64String, id: window.userId })
      })
        .then(response => response.json())
        .then(d => {
          document.getElementById('inputField').value = d.choices[0].message.content;
          console.log('Success:', d);
        })
        .catch((error) => {
          console.error('Error:', error);
        })
        .finally(() => {
          // Restore label state after processing
          imgLabel.textContent = "📷 upload screenshot of chat or profile";
          imgLabel.style.backgroundColor = "white";
          imgLabel.style.pointerEvents = "auto";
        });
    };

    reader.readAsDataURL(file);
  } else {
    // Restore the label if no file was selected
    imgLabel.textContent = "📷 upload screenshot of chat or profile";
    imgLabel.style.backgroundColor = "white";
    imgLabel.style.pointerEvents = "auto";
  }
});









        const respondButton = document.getElementById('respondButton');
        const inputField = document.getElementById('inputField');
        const responseContainer = document.getElementById('responseContainer');
        let responseState = "respond";



      ///


let placeholders = [[{
  responses: [
    "i'll let u finish then",
    "guess ur in demand",
    "i knew u were popular",
    "bet she's busy with me",
    "tell her her loss",
    "she'll come back",
    "lmfao aight lil sis",
    "oops my calendar might be wrong",
    "booked n busy huh",
    "not my prob"
  ]
}, "me: hey princess I love you!\nher: she busy little bro"],
[{
  responses: [
    "who said i'm ur bae",
    "will u feed me",
    "my schedule's tight",
    "under one condition",
    "don't say it unless u mean it",
    "those feet still cold at night",
    "lmfao aight lil sis",
    "keepin it lowkey tonight",
    "aight let me get my helmet",
    "ok"
  ]
}, `her: come over bae`],
[{
  responses: [
    "told u I have amnesia",
    "its all about perspective",
    "why u so curious",
    "who's asking",
    "i'll think abt it",
    "guess ur stuck with me",
    "oh we r somethin",
    "u been catchin feelings huh",
    "let's not label it",
    "define relationship lol"
  ]
}, "her: what are we?\nme: why do you ask\nher: it feels like we are in a relationship but we never had the convo"],
 [{
  responses: [
    "milf magnet sorry",
    "idk she was feelin me",
    "ur mom calls me",
    "bc she's hot af",
    "pls don't be mad princess",
    "ur moms my type",
    "was practicing my lines",
    "keeping it in the fam",
    "she's cuter than u tbh",
    "needed a backup plan"
  ]
}, `her: why were you flirting with my mom?`]]

let r = placeholders[Math.floor(Math.random() * placeholders.length)]

document.getElementById("inputField").innerHTML= r[1];

const placeholderResponse = r[0];
//const newResponse = document.createElement('div');


let content = "";
placeholderResponse.responses.forEach(response => {
  content += `<button class="response" onclick="copyText(this)">${response}</button>`;

});
//newResponse.innerHTML = content;
responseContainer.insertAdjacentHTML('afterbegin', content);

//responseContainer.prepend(newResponse);
      ///





        respondButton.addEventListener('click', async () => {

            respondButton.textContent = "loading...";
            respondButton.style.backgroundColor = "lightgray"
            respondButton.disabled = true;

            if (window.userId === undefined) {
                console.error("User is not logged in.");
                signin();
                respondButton.disabled = false;
                
            }


            const history = inputField.value.trim();

            if (history != "") {
                try {
                    const response = await fetch(`https://dubrizz-production.up.railway.app/rizz?history=${encodeURIComponent(history)}&id=${encodeURIComponent(window.userId)}&tone=${encodeURIComponent(window.character)}`);



                    if (response.status === 401) {
                        console.error("User is not logged in.");
                        signin();

                    }

                    const data = await response.json();

                    //const newResponse = document.createElement('div');
                    const obj = JSON.parse(data.response);


                    let content = "";
                    obj.responses.forEach(response => {
                      content += `<button class="response" onclick="copyText(this)">${response}</button><br/>`;

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




                    //newResponse.innerHTML = content;





                    //newResponse.classList.add('animate');
                    //responseContainer.prepend(newResponse);
                  responseContainer.insertAdjacentHTML('afterbegin', content);



                    respondButton.disabled = false;
                    respondButton.textContent = "again";
                    respondButton.style.backgroundColor = "lightcoral"
                } catch (error) {
                    console.error('Error fetching the response:', error);



                    const fallbackResponse = document.createElement('div');

                    //fallbackResponse.classList.add('animate');
                    responseContainer.prepend(fallbackResponse);
                    //const newResponse = document.createElement('div');
                    if(document.getElementById("credits").innerHTML.substring(0, 20) == `u ran out of credits`){
                        newResponse.innerHTML = `<div class="error">Get more credits with <a href="`+document.getElementById("paylink").href+`">pro</a></div>`;
                    }else {
                        newResponse.innerHTML = '<div class="error">Error! Rephrase and try again</div>';
                    }

                    //newResponse.classList.add('animate');
                    //responseContainer.prepend(newResponse);
                    responseContainer.insertAdjacentHTML('afterbegin', content);
                    respondButton.disabled = false;
                    respondButton.textContent = "again";
                    respondButton.style.backgroundColor = "lightcoral"







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



//////////////



