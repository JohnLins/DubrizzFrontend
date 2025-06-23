import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Global variables
window.userId = undefined;
window.character = "nonchalant";
let userName;
let uploadedFiles = [];
let currentChatId = null;
let chatHistory = [];
let sampleShown = false;  // Flag to prevent duplicate sample responses

// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : 'https://api.dubrizz.com';

console.log('Using API Base URL:', API_BASE_URL);

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
const db = getFirestore(app);
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

console.log('Firebase initialized successfully');
console.log('Firebase app:', app);
console.log('Firestore db:', db);
console.log('Auth object:', auth);

// Copy text function
window.copyText = function(button) {
  const textToCopy = button.innerText;
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      window.alert("copied '" + textToCopy + "'");
    })
    .catch(err => {
      console.error("Failed to copy text: ", err);
    });
};

// Display payment link
function displaypaymentlink(email) {
  const paylink = document.getElementById("paylink");
  paylink.style.display = "block";
  paylink.href = "https://buy.stripe.com/cN2aHD67QbNweT6aEE?prefilled_email=" + email;
}

// Sign in function
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

      // Register user with backend
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
            
      // Load user's chat history
      loadChatHistory();
      
      // Clear the interface and hide sample response
      clearInterface();
      document.getElementById('sample-response').style.display = 'none';
    })
    .catch((error) => {
      console.error("Error signing in:", error);
    });
}

// Detect and display user on page load
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.userId = user.uid;
    userName = user.displayName;
    
    console.log('User authenticated:', user.uid);
    console.log('User email:', user.email);
    console.log('Auth state:', auth.currentUser);

    const userDiv = document.getElementById('user');
    const googleLoginBtn = document.getElementById('google-login-btn');
    googleLoginBtn.style.display = 'none';

    const userNameSpan = document.getElementById('username');
    userNameSpan.innerHTML = `<b>hey ` + userName.split(" ")[0] + `!</b>`;

    displaypaymentlink(user.email);
    loadChatHistory();
    clearInterface();
    document.getElementById('sample-response').style.display = 'none';
  } else {
    console.log('User not authenticated');
    window.userId = undefined;
    // Show sample response when not logged in
    showSampleResponse();
  }
});

// Event listener for the login button
const googleLogin = document.getElementById("google-login-btn");
googleLogin.addEventListener("click", function() {
  signin();
});

// Sample response data (stored as JSON)
const sampleResponseData = {
  "analysis": "She's testing your interest level and seeing how you'll react. This is classic behavior when someone's uncertain about where they stand. The delayed responses and short answers suggest she's either playing hard to get or genuinely busy but maintaining some interest.",
  "why": [
    "She's testing your patience and seeing if you'll chase",
    "She might be talking to other people and comparing options", 
    "She's unsure about her feelings and buying time to figure them out",
    "She's using scarcity to increase her perceived value"
  ],
  "attachment_styles": {
    "user": "Anxious-Secure",
    "user_description": "You're analyzing her behavior closely, showing some anxious tendencies but asking for advice shows self-awareness",
    "their": "Avoidant-Anxious", 
    "their_description": "Hot and cold behavior, creating distance when things get too close but still maintaining contact"
  },
  "flags": {
    "red": [
      "Inconsistent communication patterns",
      "Making you question where you stand",
      "Not matching your energy investment"
    ],
    "green": [
      "Still responding to your messages",
      "Initiated some conversations recently",
      "Hasn't completely cut contact" 
    ]
  },
  "do": [
    "Mirror her energy - if she's distant, you be distant too",
    "Don't double text or chase when she goes quiet",
    "Focus on other options and building your social circle", 
    "When she does reach out, be friendly but not overly eager",
    "Give her space to come to you instead of pursuing"
  ],
  "responses": [
    "haha fair enough",
    "cool, lmk when you're free",
    "no worries, catch you later",
    "sounds good 👍"
  ]
};

// Sample input text
const sampleInputText = `Her: hey what's up
Me: not much just chilling, you?
Her: same, just watching netflix
Me: nice what show?
Her: just some random thing
Me: cool cool
[seen 3 hours ago]
Me: hey you free this weekend?
[seen 2 days ago]
Her: sorry been super busy with work
Me: no worries, maybe next time
Her: yeah definitely

She used to text me back way faster and now it takes forever. What's going on?`;

// Show sample response
function showSampleResponse() {
  // Prevent showing sample multiple times
  if (sampleShown) return;
  
  // Clear any existing content first
  document.getElementById('responseContainer').innerHTML = '';
  
  // Hide the separate sample response div
  document.getElementById('sample-response').style.display = 'none';
  
  // Add sample input text
  document.getElementById('inputField').value = sampleInputText;
  
  // Display the sample response using the same function as real responses
  displayEnhancedResponse(sampleResponseData);
  
  // Dim the main interface to show it's a sample
  document.getElementById('main-interface').style.opacity = '0.7';
  
  // Add a notice that this is a sample
  const responseContainer = document.getElementById('responseContainer');
  const sampleNotice = document.createElement('div');
  sampleNotice.className = 'sample-notice';
  sampleNotice.innerHTML = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 15px; 
                border-radius: 10px; 
                margin-bottom: 20px; 
                text-align: center;
                font-weight: bold;">
      🎭 This is a sample analysis - Sign in to get personalized advice for your situation!
    </div>
  `;
  responseContainer.insertBefore(sampleNotice, responseContainer.firstChild);
  
  // Mark sample as shown
  sampleShown = true;
}

// Clear interface
function clearInterface() {
  document.getElementById('inputField').value = '';
  document.getElementById('responseContainer').innerHTML = '';
  uploadedFiles = [];
  updateFilePreview();
  document.getElementById('main-interface').style.opacity = '1';
  document.getElementById('sample-response').style.display = 'none';
  
  // Reset sample flag
  sampleShown = false;
}

// Fetch user credits
function fetchUserCredits(userId) {
  const url = `${API_BASE_URL}/credits?uid=${encodeURIComponent(userId)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.credits !== undefined) {
        if (data.credits == 0) {
          document.getElementById("credits").innerHTML = `u ran out of credits, get more with <a href="${document.getElementById("paylink").href}">pro</a>`;
        } else {
          document.getElementById("credits").innerHTML = `credits remaining: <b>${data.credits}</b>`;
        }
      } else {
        window.alert(`Error: ${data.error}`);
      }
    })
    .catch(error => {
      window.alert(`Error fetching credits: ${error.message}`);
    });
}

// File upload handling
const uploadBtn = document.getElementById('upload-btn');
const imageInput = document.getElementById('imageInput');

uploadBtn.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', function(event) {
            if (window.userId === undefined) {
                console.error("User is not logged in.");
                signin();
    return;
  }

  const files = Array.from(event.target.files);
  files.forEach(file => {
    if (file) {
      uploadedFiles.push(file);
    }
  });
  
  updateFilePreview();
  event.target.value = ''; // Reset input
});

// Update file preview
function updateFilePreview() {
  const preview = document.getElementById('uploaded-files-preview');
  preview.innerHTML = '';
  
  uploadedFiles.forEach((file, index) => {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-preview';
    fileDiv.innerHTML = `
      <span>📷 ${file.name}</span>
      <span class="remove-file" onclick="removeFile(${index})">×</span>
    `;
    preview.appendChild(fileDiv);
  });
}

// Remove file function
window.removeFile = function(index) {
  uploadedFiles.splice(index, 1);
  updateFilePreview();
};

// Process uploaded images
async function processImages() {
  const processedTexts = [];
  
  for (const file of uploadedFiles) {
    try {
      const base64String = await fileToBase64(file);
      const response = await fetch(`${API_BASE_URL}/ss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ base: base64String, id: window.userId })
      });
      
      const data = await response.json();
      processedTexts.push(data.choices[0].message.content);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }
  
  return processedTexts.join('\n\n');
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64String = e.target.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Main submission handler
const submitButton = document.getElementById('submitButton');
        const inputField = document.getElementById('inputField');
        const responseContainer = document.getElementById('responseContainer');
const loadingContainer = document.getElementById('loading-container');

submitButton.addEventListener('click', async () => {
            if (window.userId === undefined) {
                console.error("User is not logged in.");
                signin();
    return;
  }

  const textInput = inputField.value.trim();
  if (!textInput && uploadedFiles.length === 0) {
    alert("Please enter some text or upload screenshots!");
    return;
  }

  // Show loading
  showLoading();
  
  try {
    // Process images if any
    let imageText = '';
    if (uploadedFiles.length > 0) {
      imageText = await processImages();
    }
    
    // Combine text and image content
    const fullInput = textInput + (imageText ? '\n\nFrom screenshots:\n' + imageText : '');
    
    // Check credits
    const creditsResponse = await fetch(`${API_BASE_URL}/credits?uid=${encodeURIComponent(window.userId)}`);
    const creditsData = await creditsResponse.json();
    
    if (creditsData.credits === 0) {
      hideLoading();
      document.getElementById("credits").innerHTML = `u ran out of credits, get more with <a href="${document.getElementById("paylink").href}">pro</a>`;
      return;
    }
    
    // Try enhanced endpoint first, fallback to original
    let response;
    let parsedData;
    
    try {
      // Get enhanced response
      response = await fetch(`${API_BASE_URL}/enhanced-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: fullInput,
          id: window.userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Enhanced advice failed with status: ${response.status}`);
                    }

                    const data = await response.json();
      console.log('Raw API response:', data);
      
      try {
        parsedData = JSON.parse(data.response);
        console.log('Parsed response data:', parsedData);
        
        // Validate that we have all required fields
        const requiredFields = ['analysis', 'why', 'attachment_styles', 'flags', 'do', 'responses'];
        const missingFields = requiredFields.filter(field => !parsedData[field]);
        
        if (missingFields.length > 0) {
          console.error('Missing required fields:', missingFields);
          console.error('Received data:', parsedData);
          throw new Error(`Incomplete response: missing ${missingFields.join(', ')}`);
        }
        
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Problematic response:', data.response);
        throw new Error('Invalid response format from server');
      }
      
    } catch (enhancedError) {
      console.log('Enhanced advice error:', enhancedError.message);
      console.log('Falling back to original advice endpoint');
      
      // Fallback to original advice endpoint
      response = await fetch(`${API_BASE_URL}/advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: fullInput,
          id: window.userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Advice API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      try {
        parsedData = JSON.parse(data.response);
        console.log('Fallback parsed data:', parsedData);
      } catch (parseError) {
        console.error('Fallback JSON parsing error:', parseError);
        throw new Error('Invalid response format from fallback server');
      }
    }
    
    // Save chat to history
    await saveChatToHistory(fullInput, parsedData);
    
    // Display enhanced response
    displayEnhancedResponse(parsedData);
    
    // Update credits
    fetchUserCredits(window.userId);
    
    // Clear input and files
    inputField.value = '';
    uploadedFiles = [];
    updateFilePreview();
    
  } catch (error) {
    console.error('Error:', error);
    hideLoading();
    alert('There was an issue processing your request. Please try again.');
  }
});

// Show loading animation
function showLoading() {
  submitButton.disabled = true;
  submitButton.textContent = 'analyzing...';
  loadingContainer.style.display = 'block';
  responseContainer.innerHTML = '';
  
  // Start progress bar animation
  startProgressBar();
}

// Hide loading animation
function hideLoading() {
  submitButton.disabled = false;
  submitButton.textContent = 'analyze situation ᡣ𐭩';
  loadingContainer.style.display = 'none';
  document.getElementById('reasoning-stream').innerHTML = '';
  
  // Reset progress bar
  resetProgressBar();
}

// Start progress bar animation
function startProgressBar() {
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const reasoningStream = document.getElementById('reasoning-stream');
  
  // Reset progress bar
  progressBar.style.width = '0%';
  progressText.textContent = '0%';
  
  // Progress bar will complete in ~120 seconds (typical API response time)
  const totalDuration = 50000; // 30 seconds
  const updateInterval = totalDuration / 120; // 120 sections
  let currentProgress = 0;
  
  const progressInterval = setInterval(() => {
    currentProgress += 1;
    const percentage = (currentProgress / 120) * 100;
    
    progressBar.style.width = percentage + '%';
    progressText.textContent = Math.round(percentage) + '%';
    
    // Add reasoning text at certain intervals
    if (currentProgress === 20) {
      reasoningStream.innerHTML += 'Analyzing conversation patterns...<br>';
    } else if (currentProgress === 40) {
      reasoningStream.innerHTML += 'Identifying communication styles...<br>';
    } else if (currentProgress === 60) {
      reasoningStream.innerHTML += 'Evaluating attachment behaviors...<br>';
    } else if (currentProgress === 80) {
      reasoningStream.innerHTML += 'Detecting red and green flags...<br>';
    } else if (currentProgress === 100) {
      reasoningStream.innerHTML += 'Generating personalized advice...<br>';
    } else if (currentProgress === 115) {
      reasoningStream.innerHTML += 'Finalizing recommendations...<br>';
    }
    
    reasoningStream.scrollTop = reasoningStream.scrollHeight;
    
    if (currentProgress >= 120) {
      clearInterval(progressInterval);
      // If API hasn't responded yet, show "almost done" message
      if (submitButton.disabled) {
        progressText.textContent = 'Almost done...';
      }
    }
  }, updateInterval);
  
  // Store interval ID so we can clear it if API responds early
  window.currentProgressInterval = progressInterval;
}

// Reset progress bar
function resetProgressBar() {
  if (window.currentProgressInterval) {
    clearInterval(window.currentProgressInterval);
    window.currentProgressInterval = null;
  }
  
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  progressBar.style.width = '0%';
  progressText.textContent = '';
}

// Chat History Management
async function loadChatHistory() {
  if (!window.userId) return;
  
  try {
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', window.userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    chatHistory = [];
    
    querySnapshot.forEach((doc) => {
      chatHistory.push({ id: doc.id, ...doc.data() });
    });
    
    displayChatHistory();
                } catch (error) {
    console.warn('Chat history unavailable (Firebase permissions):', error.message);
    // Show that chat history is unavailable but app still works
    chatHistory = [];
    displayChatHistoryUnavailable();
  }
}

function displayChatHistory() {
  const chatList = document.getElementById('chat-history-list');
  chatList.innerHTML = '';
  
  if (chatHistory.length === 0) {
    const emptyItem = document.createElement('div');
    emptyItem.className = 'chat-history-item';
    emptyItem.textContent = 'No previous chats';
    emptyItem.style.opacity = '0.6';
    emptyItem.style.cursor = 'default';
    chatList.appendChild(emptyItem);
    return;
  }
  
  chatHistory.forEach((chat, index) => {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-history-item';
    if (chat.id === currentChatId) {
      chatItem.classList.add('active');
    }
    
    chatItem.textContent = chat.title || `Chat ${index + 1}`;
    chatItem.onclick = () => loadChat(chat);
    
    chatList.appendChild(chatItem);
  });
}

function displayChatHistoryUnavailable() {
  const chatList = document.getElementById('chat-history-list');
  chatList.innerHTML = '';
  
  const unavailableItem = document.createElement('div');
  unavailableItem.className = 'chat-history-item';
  unavailableItem.textContent = 'Chat history temporarily unavailable';
  unavailableItem.style.opacity = '0.5';
  unavailableItem.style.cursor = 'default';
  unavailableItem.style.fontSize = '0.75em';
  chatList.appendChild(unavailableItem);
  
  // Show the helpful note
  const note = document.getElementById('chat-history-note');
  if (note) {
    note.style.display = 'block';
  }
}

async function saveChatToHistory(input, response) {
  if (!window.userId) {
    console.log('User not authenticated, skipping chat save');
    return;
  }
  
  try {
    // Generate chat title using first part of input
    const title = await generateChatTitle(input);
    
    const chatData = {
      userId: window.userId,
      title: title,
      input: input,
      response: response,
      timestamp: new Date()
    };
    
    console.log('Attempting to save chat to Firestore:', chatData);
    
    const docRef = await addDoc(collection(db, 'chats'), chatData);
    currentChatId = docRef.id;
    
    console.log('Chat saved successfully with ID:', currentChatId);
    
    // Reload chat history
    await loadChatHistory();
  } catch (error) {
    console.error('Firebase save error details:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // More specific error handling
    if (error.code === 'permission-denied') {
      console.error('Permission denied - check Firestore rules');
    } else if (error.code === 'unauthenticated') {
      console.error('User not authenticated properly');
    }
    
    // Don't fail the entire process if we can't save to history
    // The analysis still works fine
  }
}

async function generateChatTitle(input) {
  // Simple title generation - you could enhance this with AI
  const words = input.split(' ').slice(0, 3);
  return words.join(' ') + '...';
}

function loadChat(chat) {
  currentChatId = chat.id;
  displayChatHistory(); // Update active state
  
  // Load the original input into the text field
  const inputField = document.getElementById('inputField');
  inputField.value = chat.input || '';
  
  // Display the saved response
  displayEnhancedResponse(chat.response);
}

// Enhanced response display with fallbacks
function displayEnhancedResponse(data) {
  hideLoading();
  
  // Clear the response container first instead of appending
  const responseContainer = document.getElementById('responseContainer');
  responseContainer.innerHTML = '';
  
  const responseGrid = document.createElement('div');
  responseGrid.className = 'response-grid';
  
  // Situation Analysis
  if (data.analysis || data.sumother) {
    const analysisSection = document.createElement('div');
    analysisSection.className = 'advice-section';
    analysisSection.innerHTML = `
      <h3>💭 Situation Analysis</h3>
      <p>${data.analysis || data.sumother || 'Analysis not available'}</p>
    `;
    responseGrid.appendChild(analysisSection);
  }
  
  // Why Section (new)
  if (data.why && data.why.length > 0) {
    const whySection = document.createElement('div');
    whySection.className = 'advice-section';
    whySection.innerHTML = `
      <h3>🤔 Why This Is Happening</h3>
      <ul>
        ${data.why.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
    responseGrid.appendChild(whySection);
  }

  // Attachment Styles
  if (data.attachment_styles) {
    const attachmentSection = document.createElement('div');
    attachmentSection.className = 'attachment-section';
    attachmentSection.innerHTML = `
      <h3>🧠 Attachment Styles</h3>
      <div class="attachment-grid">
        <div class="attachment-card user-attachment">
          <h4>Your Style: ${data.attachment_styles.user || 'Analyzing...'}</h4>
          <p>${data.attachment_styles.user_description || 'Based on your communication patterns'}</p>
        </div>
        <div class="attachment-card their-attachment">
          <h4>Their Style: ${data.attachment_styles.their || 'Analyzing...'}</h4>
          <p>${data.attachment_styles.their_description || 'Based on their behavior patterns'}</p>
        </div>
      </div>
    `;
    responseGrid.appendChild(attachmentSection);
  }
  
  // Red and Green Flags
  if (data.flags) {
    const flagsSection = document.createElement('div');
    flagsSection.className = 'flags-section';
    flagsSection.innerHTML = `
      <h3>🚩 Red & Green Flags</h3>
      <div class="flags-grid">
        <div class="red-flags">
          <h4>🔴 Red Flags</h4>
          <ul>
            ${(data.flags.red || []).map(flag => `<li>${flag}</li>`).join('') || '<li>No red flags detected</li>'}
          </ul>
        </div>
        <div class="green-flags">
          <h4>🟢 Green Flags</h4>
          <ul>
            ${(data.flags.green || []).map(flag => `<li>${flag}</li>`).join('') || '<li>No green flags detected</li>'}
          </ul>
        </div>
      </div>
    `;
    responseGrid.appendChild(flagsSection);
  }
  
  // Simple Actions (new - bullet points)
  if (data.do && data.do.length > 0) {
    const actionsSection = document.createElement('div');
    actionsSection.className = 'actions-section';
    actionsSection.innerHTML = `
      <h3>📝 What To Do</h3>
      <ul class="simple-actions">
        ${data.do.map(action => `<li>${action}</li>`).join('')}
      </ul>
    `;
    responseGrid.appendChild(actionsSection);
  }
  
  // Grok Response Suggestions (styled)
  const responses = data.responses || [];
  if (responses && responses.length > 0) {
    const responsesSection = document.createElement('div');
    responsesSection.className = 'responses-section';
    responsesSection.innerHTML = `
      <h3>💬 Suggested Responses</h3>
      <div class="response-buttons">
        ${responses.map(response => 
          `<button class="response-option" onclick="copyText(this)">${response}</button>`
        ).join('')}
      </div>
    `;
    responseGrid.appendChild(responsesSection);
  }
  
  responseContainer.appendChild(responseGrid);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Initial setup
  if (window.userId) {
    fetchUserCredits(window.userId);
    loadChatHistory();
  } else {
    showSampleResponse();
  }
});



