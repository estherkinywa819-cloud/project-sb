let posts = JSON.parse(localStorage.getItem("posts")) || [];

// Ensure all posts have required properties
posts = posts.map(post => {
    if (!post) return post;
    return {
        id: post.id || Date.now(),
        name: post.name || "Anonymous",
        category: post.category || "",
        description: post.description || "",
        isPrivate: post.isPrivate !== undefined ? post.isPrivate : (post.private || false),
        supports: post.supports || 0,
        status: post.status || "Pending",
        department: post.department || "Unassigned",
        aiFlagged: post.aiFlagged || false,
        aiReason: post.aiReason || "",
        readByAdmin: post.readByAdmin || false,
        viewCount: post.viewCount || 0,
        hasBeenViewed: post.hasBeenViewed || false,
        submittedBy: post.submittedBy || "unknown",
        isDeleted: post.isDeleted || false,
        replies: post.replies || [],
        files: post.files || []
    };
});

let currentRole = null;
let selectedRole = null;
let staffRegisterMode = false;
let accounts = JSON.parse(localStorage.getItem("accounts")) || { staff: {} };

console.log("Posts loaded on page load:", posts.length, "posts");

function savePosts(){
    console.log("Saving posts:", posts.length, "posts to localStorage");
    localStorage.setItem("posts", JSON.stringify(posts));
    console.log("Posts saved. Checking localStorage:", JSON.parse(localStorage.getItem("posts")).length, "posts");
}

if (typeof savePostsWithFirebase === 'undefined') {
    var savePostsWithFirebase = savePosts;
}

function saveAccounts(){
    localStorage.setItem("accounts", JSON.stringify(accounts));
}

function updateStaffLoginUI(){
    const info = document.getElementById("loginModeInfo");
    const toggleBtn = document.getElementById("toggleStaffModeBtn");
    const loginBtn = document.getElementById("loginBtn");
    if (!info || !toggleBtn || !loginBtn) return;

    if (staffRegisterMode) {
        document.getElementById("loginTitle").textContent = "Registration";
        info.textContent = "Create a username and unique password. You can use this login afterward.";
        loginBtn.textContent = "Register";
        toggleBtn.textContent = "Already have an account? Login";
    } else {
        document.getElementById("loginTitle").textContent = "Verification";
        info.textContent = "Enter your username and password.";
        loginBtn.textContent = "Login";
        toggleBtn.textContent = "Create a new account";
    }
}

function showTab(tabId, button){
    document.querySelectorAll(".tab").forEach(tab=>{
        tab.classList.add("hidden");
    });

    document.getElementById(tabId).classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(btn=>{
        btn.classList.remove("active");
    });

    button.classList.add("active");

    if(tabId === "submit") renderMySubmissions();
    if(tabId === "board") renderBoard();
    if(tabId === "admin") renderAdmin();
}

// ===== FILE HANDLING FUNCTIONS =====
let tempFiles = { submit: [], edit: [] }; // Temporary storage for files before submission

function handleFileSelect(event, mode) {
    const files = event.target.files;
    if (!files) return;

    if (!tempFiles[mode]) {
        tempFiles[mode] = [];
    }

    for (let file of files) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showCustomAlert("File Too Large", `${file.name} exceeds 5MB limit. Please choose a smaller file.`);
            continue;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileObj = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result // Base64 encoded data
            };
            tempFiles[mode].push(fileObj);
            displayFiles(mode);
        };
        reader.readAsDataURL(file);
    }

    // Reset file input
    if (mode === 'submit') {
        document.getElementById("fileInput").value = '';
    } else if (mode === 'edit') {
        document.getElementById("editFileInput").value = '';
    }
}

function displayFiles(mode) {
    const container = document.getElementById(`fileList${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    if (!container) return;

    container.innerHTML = '';
    if (tempFiles[mode].length === 0) {
        return;
    }

    const fileList = document.createElement('div');
    fileList.style.marginTop = '10px';

    tempFiles[mode].forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.style.display = 'flex';
        fileItem.style.justifyContent = 'space-between';
        fileItem.style.alignItems = 'center';
        fileItem.style.padding = '8px 10px';
        fileItem.style.backgroundColor = '#f0fdf4';
        fileItem.style.border = '1px solid #86efac';
        fileItem.style.borderRadius = '4px';
        fileItem.style.marginBottom = '8px';
        fileItem.style.fontSize = '13px';

        const fileInfo = document.createElement('span');
        fileInfo.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.background = '#ef4444';
        removeBtn.style.color = 'white';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '4px';
        removeBtn.style.padding = '4px 8px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '12px';
        removeBtn.onclick = () => {
            tempFiles[mode].splice(index, 1);
            displayFiles(mode);
        };

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
    });

    container.appendChild(fileList);
}

function getFilesDisplay(files) {
    if (!files || files.length === 0) {
        return '';
    }

    let filesHTML = '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">';
    filesHTML += '<div style="font-weight: bold; color: #0f766e; margin-bottom: 8px; font-size: 13px;">📎 Attachments (' + files.length + ')</div>';
    filesHTML += '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';

    files.forEach(file => {
        const sizeKB = (file.size / 1024).toFixed(1);
        filesHTML += `
            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 4px; padding: 6px 10px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                <span>📄 ${file.name} (${sizeKB} KB)</span>
                <button class="support" style="background: #0284c7; color: white; padding: 2px 6px; font-size: 11px; margin: 0; border: none; border-radius: 3px; cursor: pointer;" onclick="downloadFile('${file.id}', ${JSON.stringify(file).replace(/'/g, '\\\'')})">Download</button>
            </div>
        `;
    });

    filesHTML += '</div></div>';
    return filesHTML;
}

function downloadFile(fileId, fileObj) {
    try {
        const link = document.createElement('a');
        link.href = fileObj.data;
        link.download = fileObj.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading file:', error);
        showCustomAlert('Download Error', 'Failed to download file. Please try again.');
    }
}

function submitPost(){
    const nameInput = document.getElementById("name").value.trim();
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value.trim();
    const isPrivate = document.getElementById("private").checked;

    console.log("Submit pressed - name:", nameInput, "category:", category, "description:", description, "private:", isPrivate);

    if(!category || description === ""){
        showCustomAlert("Validation Error", "Please select a category and enter a description.");
        console.log("Validation failed - category:", category, "description empty:", description === "");
        return;
    }

    const newPost = {
        id: Date.now(),
        name: nameInput === "" ? "Anonymous" : nameInput,
        category: category,
        description: description,
        isPrivate: isPrivate,
        supports: 0,
        status: "Pending",
        department: "Unassigned",
        aiFlagged: false,
        aiReason: "",
        readByAdmin: false,
        viewCount: 0,
        submittedBy: currentRole,
        isDeleted: false,
        replies: [],
        files: tempFiles.submit || []
    };

    analyzePostWithAI(newPost);

    posts.push(newPost);

    savePostsWithFirebase();

    // Save to user's local submissions list
    let mySubmissions = JSON.parse(localStorage.getItem("mySubmissions")) || [];
    mySubmissions.push(newPost.id);
    localStorage.setItem("mySubmissions", JSON.stringify(mySubmissions));
    renderMySubmissions();

    console.log("Post submitted successfully. Total posts:", posts.length, "All posts:", posts);

    document.getElementById("name").value = "";
    document.getElementById("category").selectedIndex = 0;
    document.getElementById("description").value = "";
    document.getElementById("private").checked = false;
    document.getElementById("fileListSubmit").innerHTML = "";
    tempFiles.submit = [];

    const confirmBox = document.getElementById("confirmationMessage");
    document.getElementById("trackingId").textContent = newPost.id;
    const filesInfo = newPost.files && newPost.files.length > 0 ? `<br>📎 ${newPost.files.length} file(s) attached.` : '';
    confirmBox.innerHTML = `<strong>Success!</strong> Your suggestion has been submitted.<br>Tracking ID: <span id="trackingId">${newPost.id}</span>${filesInfo}<br>${newPost.isPrivate ? 'This issue is private and visible only to admin.' : 'This issue is visible on the board.'}`;
    confirmBox.classList.remove("hidden");

    console.log("Confirmation message displayed. isPrivate:", newPost.isPrivate);

    setTimeout(() => {
        confirmBox.classList.add("hidden");
    }, 5000);

    if (!document.getElementById("board").classList.contains("hidden")) {
        console.log("Rendering board...");
        renderBoard();
    }
    if (!document.getElementById("admin").classList.contains("hidden")) {
        console.log("Rendering admin view...");
        renderAdmin();
    }
    updateAdminNotifications();
    console.log("Admin notifications updated");
}

function renderBoard(){
    const container = document.getElementById("boardPosts");
    container.innerHTML = "";

    // Increment view count for board posts
    posts.forEach(post => {
        if (!post.isPrivate && !post.hasBeenViewed && !post.isDeleted) {
            post.viewCount = (post.viewCount || 0) + 1;
            post.hasBeenViewed = true;
        }
    });
    savePostsWithFirebase();

    // Filter based on current role
    let visiblePosts = posts.filter(p => {
        if (p.isDeleted) return false;
        if (p.isPrivate) return false;
        if (currentRole === 'student') return p.submittedBy === 'student';
        if (currentRole === 'staff') return p.submittedBy === 'staff';
        return true; // admin sees all public posts
    }).slice().sort((a,b) => b.id - a.id);

    const title = document.getElementById("boardTitle");
    if (currentRole === 'student') {
        title.textContent = "Student Submissions & Board";
    } else if (currentRole === 'staff') {
        title.textContent = "Staff Submissions & Board";
    } else if (currentRole === 'admin') {
        title.textContent = "All Public Submissions";
    }

    const privateCount = posts.filter(p => p.isPrivate && !p.isDeleted).length;

    if (visiblePosts.length === 0) {
        container.innerHTML = `<p style='text-align:center; color:#555; margin-top: 20px;'>No submissions yet.${privateCount > 0 ? ` ${privateCount} private submission${privateCount === 1 ? '' : 's'} are hidden from view.` : ''}</p>`;
        return;
    }

    visiblePosts.forEach(post => {
        const div = document.createElement("div");
        div.className = "card";

        let statusColor = post.status === "Pending" ? "#1e40af" : post.status === "Reviewed" ? "#1e40af" : "#22c55e";
        let statusTextColor = post.status === "Pending" ? "white" : "white";

        // Check if this is the user's own post via localStorage
        const mySubmissions = JSON.parse(localStorage.getItem("mySubmissions")) || [];
        const isOwnPost = mySubmissions.includes(post.id);
        const canDelete = isOwnPost || currentRole === 'admin';
        const deleteBtn = canDelete ? `<button class="delete-btn" style="margin-left:10px; background:#ef4444; color:white; padding:8px 12px; border:none; border-radius:4px; cursor:pointer;" onclick="${currentRole === 'admin' ? 'deletePost' : 'deleteOwnPost'}(${post.id})">Delete</button>` : '';
        const editBtn = isOwnPost ? `<button class="support" style="margin-left:10px; background:#cbd5e1; color:#1f2937; padding:8px 12px; border:none; border-radius:4px; cursor:pointer;" onclick="openEditModal(${post.id})">Edit</button>` : '';

        // Generate replies HTML
        let repliesHTML = '';
        if (post.replies && post.replies.length > 0) {
            repliesHTML = `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <h4 style="margin-top: 0; margin-bottom: 10px; color: #0f766e; font-size: 14px;">Conversation (${post.replies.length})</h4>
                <div style="background: #f0fdfa; padding: 10px; border-radius: 6px; border-left: 3px solid #0f766e;">
                    ${post.replies.map((reply, idx) => `
                        <div style="padding: 10px 0; ${idx < post.replies.length - 1 ? 'border-bottom: 1px solid #ccebf8;' : ''}">
                            <div style="font-weight: bold; color: ${reply.isAdminReply ? '#0f766e' : '#0284c7'}; font-size: 12px; margin-bottom: 4px;">
                                ${reply.isAdminReply ? '👨‍💼 Admin' : '👤 ' + (reply.userName || 'You')} - ${new Date(reply.timestamp).toLocaleString()}
                            </div>
                            <div style="color: #374151; font-size: 13px; line-height: 1.5; margin-bottom: ${reply.userResponses && reply.userResponses.length > 0 ? '10px' : '0'};">${reply.text}</div>
                            ${reply.userResponses && reply.userResponses.length > 0 ? `
                                <div style="margin-left: 15px; padding-left: 10px; border-left: 2px solid #cbd5e1; margin-top: 8px;">
                                    ${reply.userResponses.map(resp => `
                                        <div style="padding: 6px 0; font-size: 12px;">
                                            <div style="font-weight: bold; color: #0284c7; font-size: 11px;">👤 ${resp.userName || 'User'} - ${new Date(resp.timestamp).toLocaleString()}</div>
                                            <div style="color: #4b5563; margin-top: 2px;">${resp.text}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                            ${reply.isAdminReply && currentRole !== 'admin' ? `
                                <button class="support" style="background: #0284c7; color: white; padding: 4px 10px; font-size: 11px; margin-top: 6px;" onclick="toggleReplyForm(${post.id}, ${reply.id})">Reply to Admin</button>
                                <div id="replyForm_${post.id}_${reply.id}" class="hidden" style="margin-top: 8px;">
                                    <textarea id="userReplyText_${post.id}_${reply.id}" placeholder="Type your response..." style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; height: 50px; resize: vertical;"></textarea>
                                    <div style="display: flex; gap: 5px; margin-top: 5px;">
                                        <button class="support" style="background: #0284c7; padding: 4px 8px; font-size: 11px; margin-top: 0;" onclick="submitUserReply(${post.id}, ${reply.id})">Send</button>
                                        <button class="support" style="background: #94a3b8; padding: 4px 8px; font-size: 11px; margin-top: 0;" onclick="toggleReplyForm(${post.id}, ${reply.id})">Cancel</button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        // Create single status badge: green if read by admin, blue if pending
        let readStatusBadge = post.readByAdmin ? 
            `<span class="badge" style="background-color: #047857; color: white; margin-left: 5px;">✓ Read</span>` : 
            `<span class="badge" style="background-color: #1e40af; color: white; margin-left: 5px;">⏳ Pending</span>`;
        
        const filesDisplay = getFilesDisplay(post.files);

        div.innerHTML = `
<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap: wrap; gap: 8px;">
    <p style="margin:0;"><strong>Category:</strong> ${post.category}</p>
    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
        ${readStatusBadge}
    </div>
</div>
<p>${post.description}</p>
<small>Submitted by: ${post.name} | ID: ${post.id} | Role: ${post.submittedBy}</small>
<span class="badge" style="margin-left: 10px;">${post.supports} Supports</span>
<span class="badge" style="margin-left: 5px; background:#1e40af; color:white;">${post.viewCount || 0} Views</span>
<br><br>
${filesDisplay}
<br>
<button class="support" onclick="supportPost(${post.id})">Second / Support</button>
${editBtn}
${deleteBtn}
${repliesHTML}
`;

        container.appendChild(div);
    });
}

function renderAdmin(){
    const container = document.getElementById("adminPosts");
    container.innerHTML = "";

    updateAdminNotifications();
    renderAdminReports();

    const filterRadios = document.querySelectorAll('input[name="adminFilter"]');
    let filterMode = "ai";
    if (filterRadios.length > 0) {
        const checked = document.querySelector('input[name="adminFilter"]:checked');
        if (checked) {
            filterMode = checked.value;
        } else {
            const allRadio = document.querySelector('input[name="adminFilter"][value="all"]');
            if (allRadio) {
                allRadio.checked = true;
                filterMode = "all";
            }
        }
    }
    
    // Admins see ALL posts from all roles
    const filteredPosts = (filterMode === "ai" ? 
        posts.filter(p => p.aiFlagged && !p.isDeleted) : 
        posts.filter(p => !p.isDeleted)
    ).slice().sort((a,b) => b.id - a.id);

    if (filteredPosts.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#555; margin-top: 20px;'>No submissions match the current filter.</p>";
        return;
    }

    filteredPosts.forEach(post => {
        const div = document.createElement("div");
        div.className = "card";
        if(post.aiFlagged) {
            div.style.borderLeft = "4px solid #ef4444";
        }

        const readBadge = post.readByAdmin ? `<span class="badge" style="background:#047857; color:white;">✓ Read</span>` : `<span class="badge" style="background:#1e40af; color:white;">✎ Unread</span>`;

        const filesDisplay = getFilesDisplay(post.files);

        div.innerHTML = `
${post.aiFlagged ? `<div style="background-color: #fee2e2; color: #b91c1c; padding: 8px; border-radius: 4px; margin-bottom: 12px; font-size: 14px;"><strong>Alert:</strong> ${post.aiReason}</div>` : ''}
<div style="display:flex; gap: 15px; flex-wrap: wrap; margin-bottom: 12px; align-items: center; justify-content: space-between;">
    <div style="font-size: 14px;"><strong>ID:</strong> ${post.id} ${readBadge} <span class="badge" style="background:#7c3aed; color:white;">${post.submittedBy.toUpperCase()}</span></div>
    <div style="display:flex; gap: 10px; flex-wrap: wrap;">
        <div>
            <select style="width:auto; padding:5px; margin:0;" onchange="updatePost(${post.id}, 'category', this.value)">
                <option value="Finance" ${post.category==='Finance'?'selected':''}>Finance</option>
                <option value="Security" ${post.category==='Security'?'selected':''}>Security</option>
                <option value="Academic Affairs" ${post.category==='Academic Affairs'?'selected':''}>Academic Affairs</option>
                <option value="Hostel" ${post.category==='Hostel'?'selected':''}>Hostel</option>
                <option value="IT Services" ${post.category==='IT Services'?'selected':''}>IT Services</option>
                <option value="Others" ${post.category==='Others'?'selected':''}>Others</option>
            </select>
        </div>
        <div>
            <select style="width:auto; padding:5px; margin:0;" onchange="updatePost(${post.id}, 'department', this.value)">
                <option value="Unassigned" ${post.department==='Unassigned'?'selected':''}>Unassigned</option>
                <option value="Finance Dept" ${post.department==='Finance Dept'?'selected':''}>Finance Dept</option>
                <option value="Campus Security" ${post.department==='Campus Security'?'selected':''}>Campus Security</option>
                <option value="Dean of Students" ${post.department==='Dean of Students'?'selected':''}>Dean of Students</option>
                <option value="Housing Office" ${post.department==='Housing Office'?'selected':''}>Housing Office</option>
                <option value="IT Support" ${post.department==='IT Support'?'selected':''}>IT Support</option>
            </select>
        </div>
        <div>
            <select style="width:auto; padding:5px; margin:0;" onchange="updatePost(${post.id}, 'status', this.value)">
                <option value="Pending" ${post.status==='Pending'?'selected':''}>Pending</option>
                <option value="Reviewed" ${post.status==='Reviewed'?'selected':''}>Reviewed</option>
                <option value="Resolved" ${post.status==='Resolved'?'selected':''}>Resolved</option>
            </select>
        </div>
    </div>
</div>
<p style="margin-top:0;"><strong>${post.name}</strong></p>
<p>${post.description}</p>
<small style="color:#555;">
Submitted by: ${post.name} | Role: ${post.submittedBy} |
${post.isPrivate?"Private to Admin":"Public"} | 
${post.supports} Supports | ${post.viewCount || 0} Views
</small>
${filesDisplay}
${post.readByAdmin ? '' : `<button class="support" style="margin-top:10px; background:#0f766e;" onclick="markPostRead(${post.id})">Mark as read</button>`}
<button class="delete-btn" style="margin-top:10px; margin-left:10px; background:#ef4444; color:white; padding:8px 12px; border:none; border-radius:4px; cursor:pointer;" onclick="deletePost(${post.id})">Delete</button>

<!-- Admin Replies Section -->
<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
    <h4 style="margin-top: 0; color: #1e3a8a; display: flex; justify-content: space-between; align-items: center;">
        <span>Conversation (${post.replies ? post.replies.length : 0})</span>
    </h4>
    
    ${post.replies && post.replies.length > 0 ? `
        <div style="background: #f3f4f6; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
            ${post.replies.map((reply, index) => `
                <div style="padding: 10px; margin-bottom: ${index < post.replies.length - 1 ? '10px' : '0'}; background: white; border-left: 3px solid #0f766e; border-radius: 4px;">
                    <div style="font-weight: bold; color: #0f766e; font-size: 13px; margin-bottom: 5px;">👨‍💼 Admin - ${new Date(reply.timestamp).toLocaleString()}</div>
                    <div style="color: #374151; font-size: 14px; line-height: 1.5; margin-bottom: ${reply.userResponses && reply.userResponses.length > 0 ? '10px' : '0'};">${reply.text}</div>
                    ${reply.userResponses && reply.userResponses.length > 0 ? `
                        <div style="margin-left: 15px; padding-left: 10px; border-left: 2px solid #cbd5e1; margin-top: 8px;">
                            ${reply.userResponses.map(resp => `
                                <div style="padding: 6px 0; font-size: 12px; border-bottom: 1px solid #f0f0f0;">
                                    <div style="font-weight: bold; color: #0284c7; font-size: 11px;">👤 ${resp.userName || 'User'} - ${new Date(resp.timestamp).toLocaleString()}</div>
                                    <div style="color: #4b5563; margin-top: 2px;">${resp.text}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    ` : '<p style="color: #9ca3af; font-size: 13px; margin: 0 0 15px 0; font-style: italic;">No replies yet</p>'}
    
    <div style="display: flex; gap: 10px; align-items: flex-start;">
        <textarea id="replyText_${post.id}" placeholder="Write an admin reply..." style="flex: 1; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-family: inherit; font-size: 14px; height: 70px; resize: vertical;"></textarea>
        <button class="support" style="background: #0f766e; color: white; padding: 10px 16px; margin-top: 0; height: fit-content; white-space: nowrap;" onclick="submitAdminReply(${post.id})">Post Reply</button>
    </div>
</div>
`;

        container.appendChild(div);
    });
}

function updateAdminNotifications() {
    const notif = document.getElementById("adminNotifications");
    const markAllReadBtn = document.getElementById("markAllReadBtn");
    const adminBadge = document.getElementById("adminBadge");
    if (!notif) return;

    const unreadCount = posts.filter(p => !p.readByAdmin && !p.isDeleted).length;
    const flaggedUnread = posts.filter(p => p.aiFlagged && !p.readByAdmin && !p.isDeleted).length;
    notif.textContent = `Unread messages: ${unreadCount}. Flagged unread: ${flaggedUnread}.`;
    if (markAllReadBtn) {
        markAllReadBtn.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
    if (adminBadge) {
        if (unreadCount > 0) {
            adminBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            adminBadge.style.display = 'flex';
        } else {
            adminBadge.style.display = 'none';
        }
    }
}

function markPostRead(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    post.readByAdmin = true;
    savePostsWithFirebase();
    renderAdmin();
}

function markAllRead() {
    posts.forEach(post => {
        if (!post.isDeleted) {
            post.readByAdmin = true;
        }
    });
    savePostsWithFirebase();
    renderAdmin();
}

function submitAdminReply(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post || post.isDeleted) return;

    const replyTextarea = document.getElementById(`replyText_${postId}`);
    const replyText = replyTextarea.value.trim();

    if (!replyText) {
        showCustomAlert("Empty Reply", "Please enter a reply before submitting.");
        return;
    }

    if (!post.replies) {
        post.replies = [];
    }

    const newReply = {
        id: Date.now(),
        text: replyText,
        timestamp: new Date().toISOString(),
        isAdminReply: true,
        userName: "Admin",
        userResponses: []
    };

    post.replies.push(newReply);
    savePostsWithFirebase();
    
    replyTextarea.value = "";
    renderAdmin();
    renderBoard();
    
    showCustomAlert("Success", "Your reply has been posted.");
}

function toggleReplyForm(postId, replyId) {
    const formId = `replyForm_${postId}_${replyId}`;
    const form = document.getElementById(formId);
    if (form) {
        form.classList.toggle("hidden");
    }
}

function submitUserReply(postId, replyId) {
    const post = posts.find(p => p.id === postId);
    if (!post || post.isDeleted) return;

    const reply = post.replies.find(r => r.id === replyId);
    if (!reply) return;

    const textareaId = `userReplyText_${postId}_${replyId}`;
    const textarea = document.getElementById(textareaId);
    const replyText = textarea.value.trim();

    if (!replyText) {
        showCustomAlert("Empty Reply", "Please enter a response before submitting.");
        return;
    }

    if (!reply.userResponses) {
        reply.userResponses = [];
    }

    const userResponse = {
        id: Date.now(),
        text: replyText,
        timestamp: new Date().toISOString(),
        userName: currentRole.toUpperCase() + " User"
    };

    reply.userResponses.push(userResponse);
    savePostsWithFirebase();
    
    // Clear and hide form
    textarea.value = "";
    toggleReplyForm(postId, replyId);
    
    renderBoard();
    renderMySubmissions();
    
    showCustomAlert("Success", "Your reply has been sent to the admin.");
}

function supportPost(id){
    const post = posts.find(p => p.id === id);
    if (!post || post.isDeleted) return;
    post.supports++;
    savePostsWithFirebase();
    renderBoard();
}

async function deletePost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    // Only admin can delete
    if (currentRole !== 'admin') {
        showCustomAlert("Access Denied", "Only admin can delete submissions.");
        return;
    }

    const confirmed = await showCustomConfirm(
        "Confirm Deletion",
        "Are you sure you want to delete this submission? This action cannot be undone.",
        "Delete",
        "#ef4444"
    );

    if (confirmed) {
        post.isDeleted = true;
        savePostsWithFirebase();
        renderBoard();
        renderAdmin();
        console.log("Post deleted:", id);
    }
}

function analyzePostWithAI(post) {
    const alarmingKeywords = ["urgent", "emergency", "danger", "threat", "harassment", "fire", "theft", "police", "critical", "insecurity", "steal", "robbery", "assault", "violence", "attack", "weapon", "bomb", "explosion", "poison", "murder", "kill", "death", "suicide", "abuse", "rape", "stalking", "bullying", "hate", "racism", "discrimination"];
    const descLower = post.description.toLowerCase();
    
    console.log("Analyzing post with AI. Description:", post.description);
    
    // Check for alarming keywords
    const foundKeywords = alarmingKeywords.filter(kw => descLower.includes(kw));
    if (foundKeywords.length > 0) {
        post.aiFlagged = true;
        post.aiReason = "Alert: Alarming Action Required (Keywords: " + foundKeywords.join(", ") + ")";
        console.log("Post flagged for alarming keywords:", foundKeywords);
        return;
    }

    // Check for repetitiveness (share 3+ words or identical description)
    const words = descLower.split(/\W+/).filter(w => w.length > 2);
    for (let i = posts.length - 1; i >= Math.max(0, posts.length - 15); i--) {
        const existingDescLower = posts[i].description.toLowerCase();
        
        // Exact match check
        if (descLower === existingDescLower) {
            post.aiFlagged = true;
            post.aiReason = "Alert: Exact Duplicate of Post ID: " + posts[i].id;
            console.log("Post flagged for exact duplicate");
            return;
        }

        const existingWords = existingDescLower.split(/\W+/);
        let overlap = words.filter(w => existingWords.includes(w)).length;
        if (overlap >= 3 && words.length >= 3) {
            post.aiFlagged = true;
            post.aiReason = "Alert: Repetitive Content (Similar to Post ID: " + posts[i].id + ")";
            console.log("Post flagged for repetitive content");
            return;
        }
    }
    console.log("Post analysis complete - no flags triggered");
}

function updatePost(id, field, value) {
    const post = posts.find(p => p.id === id);
    if(post && !post.isDeleted) {
        post[field] = value;
        savePostsWithFirebase();
        if(!document.getElementById("board").classList.contains("hidden")) renderBoard();
        if(!document.getElementById("admin").classList.contains("hidden")) renderAdmin();
    }
}

// Auth & Role Management
function selectRole(role) {
    document.getElementById("landingPage").classList.add("hidden");
    document.getElementById("backBtn").classList.remove("hidden");
    selectedRole = role;
    staffRegisterMode = false;
    document.getElementById("loginError").classList.add("hidden");
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";

    if (role === 'student') {
        launchApp('student');
    } else if (role === 'staff') {
        launchApp('staff');
    } else if (role === 'admin') {
        document.getElementById("loginPage").classList.remove("hidden");
        document.getElementById("toggleStaffModeBtn").style.display = 'none';
        document.getElementById("loginTitle").textContent = "Admin Verification";
    }
}

function attemptLogin() {
    const user = document.getElementById("loginUser").value.trim().toLowerCase();
    const pass = document.getElementById("loginPass").value.trim();

    let isValid = false;
    let role = null;
    let errorMessage = "";

    // Admin credentials
    if (selectedRole === 'admin' && user === 'admin' && pass === 'admin123') {
        isValid = true;
        role = 'admin';
    }

    // Display result
    if (isValid) {
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("loginError").classList.add("hidden");
        launchApp(role);
    } else {
        document.getElementById("loginError").textContent = "Invalid admin credentials. Please try again.";
        document.getElementById("loginError").classList.remove("hidden");
        document.getElementById("loginPass").value = "";
    }
}

function launchApp(role) {
    currentRole = role;
    document.getElementById("appContainer").classList.remove("hidden");
    document.getElementById("logoutBtn").classList.remove("hidden");
    document.getElementById("backBtn").classList.remove("hidden");
    
    // Update current role display
    const roleDisplay = document.getElementById("currentRoleDisplay");
    roleDisplay.textContent = role.charAt(0).toUpperCase() + role.slice(1);

    if (role === 'student' || role === 'staff') {
        // Hide admin tab, show submit and board
        document.getElementById("nav-admin").classList.add("hidden");
        document.getElementById("nav-submit").classList.remove("hidden");
        document.getElementById("nav-board").classList.remove("hidden");
        showTab('submit', document.getElementById("nav-submit"));
    } else if (role === 'admin') {
        // Show admin tab, hide submit
        document.getElementById("nav-submit").classList.add("hidden");
        document.getElementById("nav-board").classList.add("hidden");
        document.getElementById("nav-admin").classList.remove("hidden");
        const allRadio = document.querySelector('input[name="adminFilter"][value="all"]');
        if (allRadio) allRadio.checked = true;
        showTab('admin', document.getElementById("nav-admin"));
    }
}

function logout() {
    document.getElementById("appContainer").classList.add("hidden");
    document.getElementById("logoutBtn").classList.add("hidden");
    document.getElementById("backBtn").classList.add("hidden");
    document.getElementById("currentRoleDisplay").textContent = "";

    // Always go to landing page for all roles
    document.getElementById("landingPage").classList.remove("hidden");
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginError").classList.add("hidden");

    currentRole = null;
}

function backToLanding() {
    // Always return to landing page from the login form
    document.getElementById("appContainer").classList.add("hidden");
    document.getElementById("logoutBtn").classList.add("hidden");
    document.getElementById("backBtn").classList.add("hidden");
    document.getElementById("currentRoleDisplay").textContent = "";

    document.getElementById("landingPage").classList.remove("hidden");
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("toggleStaffModeBtn").style.display = 'none';

    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    document.getElementById("loginError").classList.add("hidden");
    document.getElementById("loginError").textContent = "Invalid credentials! Please try again.";

    selectedRole = null;
    staffRegisterMode = false;
    currentRole = null;
}

// Header back behaves like "previous action": if staff was selected or logged in, go to staff login; else landing
function headerBack(){
    // If the login page is currently visible, return to the landing page.
    if (!document.getElementById("loginPage").classList.contains("hidden")) {
        backToLanding();
        return;
    }

    // If currently in app, return to landing
    document.getElementById("landingPage").classList.remove("hidden");
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("appContainer").classList.add("hidden");
    document.getElementById("logoutBtn").classList.add("hidden");
    document.getElementById("backBtn").classList.add("hidden");
    selectedRole = null;
    staffRegisterMode = false;
    currentRole = null;
}

function toggleStaffMode(){
    staffRegisterMode = !staffRegisterMode;
    document.getElementById("loginError").classList.add("hidden");
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    updateStaffLoginUI();
}

// Note: Staff no longer requires account registration - direct access maintained for anonymity

function togglePassword() {
    const passInput = document.getElementById("loginPass");
    if (passInput.type === "password") {
        passInput.type = "text";
    } else {
        passInput.type = "password";
    }
}

// User submission list rendering
function renderMySubmissions() {
    const container = document.getElementById("mySubmissionsList");
    if (!container) return;
    container.innerHTML = "";

    const mySubmissions = JSON.parse(localStorage.getItem("mySubmissions")) || [];
    
    // Filter posts that are owned by the user (ID is in mySubmissions list) and not deleted,
    // AND belong to the current logged-in role
    const myPosts = posts.filter(p => mySubmissions.includes(p.id) && !p.isDeleted && p.submittedBy === currentRole);

    if (myPosts.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#6b7280; font-size:14px; margin: 15px 0 0 0;">You haven't submitted any suggestions under this role on this browser yet.</p>`;
        return;
    }

    myPosts.slice().sort((a, b) => b.id - a.id).forEach(post => {
        const div = document.createElement("div");
        div.style.border = "1px solid rgba(226, 232, 240, 0.8)";
        div.style.background = "rgba(255, 255, 255, 0.6)";
        div.style.padding = "12px";
        div.style.borderRadius = "6px";
        div.style.marginBottom = "10px";
        div.style.display = "flex";
        div.style.justifyContent = "space-between";
        div.style.alignItems = "flex-start";
        div.style.flexWrap = "wrap";
        div.style.gap = "10px";

        let statusColor = post.status === "Pending" ? "#1e40af" : post.status === "Reviewed" ? "#1e40af" : "#10b981";
        let statusTextColor = post.status === "Pending" ? "white" : "white";

        // Generate replies HTML for submissions list
        let repliesHTML = '';
        if (post.replies && post.replies.length > 0) {
            repliesHTML = `
            <div style="width: 100%; margin-top: 12px; padding-top: 12px; border-top: 1px solid #d1d5db;">
                <div style="font-size: 12px; font-weight: bold; color: #0f766e; margin-bottom: 8px;">Conversation (${post.replies.length}):</div>
                ${post.replies.map(reply => `
                    <div style="background: #f0fdfa; padding: 8px; border-radius: 4px; border-left: 2px solid #0f766e; margin-bottom: 6px; font-size: 12px;">
                        <div style="color: #0f766e; font-weight: bold; font-size: 11px; margin-bottom: 3px;">👨‍💼 ${reply.userName || 'Admin'} - ${new Date(reply.timestamp).toLocaleString()}</div>
                        <div style="color: #374151; line-height: 1.4; margin-bottom: ${reply.userResponses && reply.userResponses.length > 0 ? '8px' : '0'};">${reply.text}</div>
                        ${reply.userResponses && reply.userResponses.length > 0 ? `
                            <div style="margin-left: 10px; padding-left: 8px; border-left: 1px solid #cbd5e1; margin-top: 6px; font-size: 11px;">
                                ${reply.userResponses.map(resp => `
                                    <div style="padding: 4px 0; color: #0284c7;">
                                        <div style="font-weight: bold; font-size: 10px;">👤 ${resp.userName || 'You'} - ${new Date(resp.timestamp).toLocaleString()}</div>
                                        <div style="color: #4b5563; margin-top: 1px;">${resp.text}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>`;
        }

        // Single badge: green if read by admin, blue if pending
        let readStatusBadge = post.readByAdmin ? 
            `<span class="badge" style="background-color: #047857; color: white; margin: 0; font-size: 11px; padding: 2px 6px;">✓ Read</span>` : 
            `<span class="badge" style="background-color: #1e40af; color: white; margin: 0; font-size: 11px; padding: 2px 6px;">⏳ Pending</span>`;
        
        div.innerHTML = `
            <div style="flex: 1; min-width: 250px;">
                <div style="display:flex; align-items:center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap;">
                    <span style="font-weight: bold; color: #1e3a8a; font-size: 14px;">[${post.category}]</span>
                    <span class="badge" style="background-color: #e2e8f0; color: #475569; margin: 0; font-size: 11px; padding: 2px 6px;">${post.isPrivate ? 'Private' : 'Public'}</span>
                    ${readStatusBadge}
                </div>
                <p style="margin: 5px 0; font-size: 13px; color: #374151; line-height: 1.4;">${post.description}</p>
                <small style="color: #6b7280; font-size: 11px;">ID: ${post.id} | ${post.supports} Supports | ${post.viewCount || 0} Views</small>
                ${repliesHTML}
            </div>
            <div style="display:flex; gap: 5px; flex-wrap: wrap; min-width: fit-content;">
                <button class="btn-edit" style="padding: 5px 10px; font-size: 12px;" onclick="openEditModal(${post.id})">Edit</button>
                <button class="btn-delete" style="padding: 5px 10px; font-size: 12px;" onclick="deleteOwnPost(${post.id})">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Find submission by tracking ID recovery
function searchByTrackingId() {
    const errorDiv = document.getElementById("trackingSearchError");
    const inputVal = document.getElementById("trackingSearchInput").value.trim();
    if (!inputVal) {
        errorDiv.textContent = "Please enter a Tracking ID.";
        errorDiv.classList.remove("hidden");
        return;
    }

    const id = parseInt(inputVal);
    const post = posts.find(p => p.id === id);

    if (!post || post.isDeleted) {
        errorDiv.textContent = "Suggestion not found. Please verify the Tracking ID.";
        errorDiv.classList.remove("hidden");
        return;
    }

    if (post.submittedBy !== currentRole) {
        errorDiv.textContent = `This submission belongs to a ${post.submittedBy.toUpperCase()} session. Please switch roles to manage it.`;
        errorDiv.classList.remove("hidden");
        return;
    }

    let mySubmissions = JSON.parse(localStorage.getItem("mySubmissions")) || [];
    if (!mySubmissions.includes(id)) {
        mySubmissions.push(id);
        localStorage.setItem("mySubmissions", JSON.stringify(mySubmissions));
    }

    errorDiv.classList.add("hidden");
    document.getElementById("trackingSearchInput").value = "";
    renderMySubmissions();
    openEditModal(id);
}

// Edit Modal functionality
function openEditModal(id) {
    const post = posts.find(p => p.id === id);
    if (!post || post.isDeleted) return;

    document.getElementById("editPostId").value = post.id;
    document.getElementById("editName").value = post.name === "Anonymous" ? "" : post.name;
    document.getElementById("editCategory").value = post.category;
    document.getElementById("editDescription").value = post.description;
    document.getElementById("editPrivate").checked = post.isPrivate;

    // Reset and display existing files
    tempFiles.edit = post.files ? [...post.files] : [];
    displayFiles('edit');

    document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
    document.getElementById("editModal").classList.add("hidden");
}

function saveEditedPost() {
    const id = parseInt(document.getElementById("editPostId").value);
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const nameInput = document.getElementById("editName").value.trim();
    const category = document.getElementById("editCategory").value;
    const description = document.getElementById("editDescription").value.trim();
    const isPrivate = document.getElementById("editPrivate").checked;

    if (!category || description === "") {
        showCustomAlert("Validation Error", "Category and description cannot be empty.");
        return;
    }

    post.name = nameInput === "" ? "Anonymous" : nameInput;
    post.category = category;
    post.description = description;
    post.isPrivate = isPrivate;
    post.files = tempFiles.edit || [];

    // Reset AI flags before re-analysis
    post.aiFlagged = false;
    post.aiReason = "";
    analyzePostWithAI(post);

    savePostsWithFirebase();
    tempFiles.edit = [];
    closeEditModal();
    
    renderMySubmissions();
    renderBoard();
    updateAdminNotifications();
    
    if (post.aiFlagged) {
        showCustomAlert("AI Filter Alert", "Your changes were saved. Note: The automated AI system flagged this post for review: " + post.aiReason);
    }
}

// Delete own post
async function deleteOwnPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const confirmed = await showCustomConfirm(
        "Confirm Deletion",
        "Are you sure you want to delete this submission? This action cannot be undone.",
        "Delete",
        "#ef4444"
    );

    if (confirmed) {
        post.isDeleted = true;
        savePostsWithFirebase();
        
        renderMySubmissions();
        renderBoard();
        renderAdmin();
        updateAdminNotifications();
    }
}

// Admin Reports and Dashboard rendering
function renderAdminReports() {
    const activePosts = posts.filter(p => !p.isDeleted);
    const totalCount = activePosts.length;
    
    const resolvedCount = activePosts.filter(p => p.status === "Resolved").length;
    const resolvedRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
    const flaggedCount = activePosts.filter(p => p.aiFlagged).length;
    const totalSupports = activePosts.reduce((sum, p) => sum + (p.supports || 0), 0);

    // Update metrics UI
    const totalEl = document.getElementById("statTotal");
    const resolvedEl = document.getElementById("statResolved");
    const flaggedEl = document.getElementById("statFlagged");
    const supportsEl = document.getElementById("statSupports");

    if (totalEl) totalEl.textContent = totalCount;
    if (resolvedEl) resolvedEl.textContent = `${resolvedCount} (${resolvedRate}%)`;
    if (flaggedEl) flaggedEl.textContent = flaggedCount;
    if (supportsEl) supportsEl.textContent = totalSupports;

    // Category breakdown table rows
    const categories = ["Finance", "Security", "Academic Affairs", "Hostel", "IT Services", "Others"];
    const tbody = document.getElementById("reportCategoryRows");
    if (!tbody) return;
    tbody.innerHTML = "";

    categories.forEach(cat => {
        const catPosts = activePosts.filter(p => p.category === cat);
        const count = catPosts.length;
        
        const publicCount = catPosts.filter(p => !p.isPrivate).length;
        const privateCount = catPosts.filter(p => p.isPrivate).length;
        
        const resolved = catPosts.filter(p => p.status === "Resolved").length;
        const pending = count - resolved;
        
        const supports = catPosts.reduce((sum, p) => sum + (p.supports || 0), 0);
        const avgSupports = count > 0 ? (supports / count).toFixed(1) : "0.0";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${cat}</strong></td>
            <td>${count}</td>
            <td><span style="color:#0284c7;">${publicCount} Public</span> / <span style="color:#64748b;">${privateCount} Private</span></td>
            <td><span style="color:#10b981;">${resolved} Resolved</span> / <span style="color:#f59e0b;">${pending} Pending</span></td>
            <td>${avgSupports}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Download CSV Report
function exportCSVReport() {
    const activePosts = posts.filter(p => !p.isDeleted);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Role,Category,Status,Department,AI Flagged,AI Reason,Supports,Views,Private,Name,Description\n";

    activePosts.forEach(post => {
        const cleanName = (post.name || "Anonymous").replace(/"/g, '""');
        const cleanDesc = (post.description || "").replace(/"/g, '""');
        const cleanReason = (post.aiReason || "").replace(/"/g, '""');

        const row = [
            post.id,
            post.submittedBy,
            post.category,
            post.status,
            post.department,
            post.aiFlagged ? "Yes" : "No",
            `"${cleanReason}"`,
            post.supports,
            post.viewCount || 0,
            post.isPrivate ? "Yes" : "No",
            `"${cleanName}"`,
            `"${cleanDesc}"`
        ].join(",");

        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `suggestion_box_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Print and PDF Report
function printPDFReport() {
    const activePosts = posts.filter(p => !p.isDeleted);
    const totalCount = activePosts.length;
    const resolvedCount = activePosts.filter(p => p.status === "Resolved").length;
    const resolvedRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
    const flaggedCount = activePosts.filter(p => p.aiFlagged).length;
    const totalSupports = activePosts.reduce((sum, p) => sum + (p.supports || 0), 0);

    const categories = ["Finance", "Security", "Academic Affairs", "Hostel", "IT Services", "Others"];
    let categoryRowsHtml = "";
    categories.forEach(cat => {
        const catPosts = activePosts.filter(p => p.category === cat);
        const count = catPosts.length;
        const publicCount = catPosts.filter(p => !p.isPrivate).length;
        const privateCount = catPosts.filter(p => p.isPrivate).length;
        const resolved = catPosts.filter(p => p.status === "Resolved").length;
        const pending = count - resolved;
        const supports = catPosts.reduce((sum, p) => sum + (p.supports || 0), 0);
        const avgSupports = count > 0 ? (supports / count).toFixed(1) : "0.0";

        categoryRowsHtml += `
            <tr>
                <td><strong>${cat}</strong></td>
                <td>${count}</td>
                <td>${publicCount} Public / ${privateCount} Private</td>
                <td>${resolved} Resolved / ${pending} Pending</td>
                <td>${avgSupports}</td>
            </tr>
        `;
    });

    let suggestionsHtml = "";
    activePosts.forEach(post => {
        suggestionsHtml += `
            <div style="border-bottom: 1px solid #ddd; padding: 10px 0; page-break-inside: avoid;">
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#555;">
                    <span><strong>ID:</strong> ${post.id} | <strong>Category:</strong> ${post.category} | <strong>Author:</strong> ${post.name} (${post.submittedBy})</span>
                    <span><strong>Status:</strong> ${post.status} | <strong>Supports:</strong> ${post.supports} | <strong>Views:</strong> ${post.viewCount || 0}</span>
                </div>
                <p style="margin: 5px 0; font-size:13px; color:#222;">${post.description}</p>
                ${post.aiFlagged ? `<div style="font-size:11px; color:#c2410c; background:#ffedd5; padding:4px 8px; border-radius:4px; margin-top:4px;"><strong>AI Flagged:</strong> ${post.aiReason}</div>` : ''}
            </div>
        `;
    });

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>University Suggestion Box Report - ${new Date().toLocaleDateString()}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
                h1 { color: #1e3a8a; border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-top: 0; }
                .meta { font-size: 14px; color: #555; margin-bottom: 20px; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                .stats-card { border: 1px solid #ccc; padding: 15px; border-radius: 6px; text-align: center; background: #f8fafc; }
                .stats-card h3 { margin: 0 0 5px; font-size: 24px; color: #1e3a8a; }
                .stats-card p { margin: 0; color: #64748b; font-size: 13px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
                th { background: #f1f5f9; }
                h2 { color: #1e3a8a; border-bottom: 1px solid #ccc; padding-bottom: 6px; margin-top: 30px; }
                @media print {
                    button { display: none; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1>University Suggestion Box Report</h1>
                <button onclick="window.print()" style="background:#0f766e; color:white; border:none; padding:8px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">Print / Save PDF</button>
            </div>
            <div class="meta">
                Generated on: ${new Date().toLocaleString()} <br>
                Admin Session Active
            </div>
            
            <div class="stats-grid">
                <div class="stats-card">
                    <h3>${totalCount}</h3>
                    <p>Total Suggestions</p>
                </div>
                <div class="stats-card">
                    <h3>${resolvedCount} (${resolvedRate}%)</h3>
                    <p>Resolved Rate</p>
                </div>
                <div class="stats-card">
                    <h3>${flaggedCount}</h3>
                    <p>AI Flagged Alerts</p>
                </div>
                <div class="stats-card">
                    <h3>${totalSupports}</h3>
                    <p>Total Supports</p>
                </div>
            </div>

            <h2>Category Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Submissions</th>
                        <th>Visibility Status</th>
                        <th>Resolution Status</th>
                        <th>Average Supports</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoryRowsHtml}
                </tbody>
            </table>

            <h2>Detailed Suggestion List</h2>
            <div>
                ${suggestionsHtml || '<p>No active suggestions found.</p>'}
            </div>
            
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Custom Modals logic
let confirmPromiseResolve = null;

function showCustomConfirm(title, message, yesText = "Confirm", yesColor = "#ef4444") {
    return new Promise((resolve) => {
        document.getElementById("confirmTitle").textContent = title;
        document.getElementById("confirmMessage").textContent = message;
        
        const yesBtn = document.getElementById("confirmYesBtn");
        yesBtn.textContent = yesText;
        yesBtn.style.backgroundColor = yesColor;
        
        // click handlers
        yesBtn.onclick = () => {
            document.getElementById("confirmModal").classList.add("hidden");
            confirmPromiseResolve = null;
            resolve(true);
        };
        
        confirmPromiseResolve = resolve;
        document.getElementById("confirmModal").classList.remove("hidden");
    });
}

function closeConfirmModal() {
    document.getElementById("confirmModal").classList.add("hidden");
    if (confirmPromiseResolve) {
        confirmPromiseResolve(false);
        confirmPromiseResolve = null;
    }
}

let alertPromiseResolve = null;

function showCustomAlert(title, message) {
    return new Promise((resolve) => {
        document.getElementById("alertTitle").textContent = title;
        document.getElementById("alertMessage").textContent = message;
        
        // Define click handler
        alertPromiseResolve = resolve;
        document.getElementById("alertModal").classList.remove("hidden");
    });
}

function closeAlertModal() {
    document.getElementById("alertModal").classList.add("hidden");
    if (alertPromiseResolve) {
        alertPromiseResolve();
        alertPromiseResolve = null;
    }
}
