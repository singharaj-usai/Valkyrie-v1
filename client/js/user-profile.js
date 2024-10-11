$(document).ready(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const username =
    urlParams.get("username") || localStorage.getItem("username");
  let currentUser;

  if (username) {
    fetchUserProfile(username);
  } else {
    $("#user-profile").html(
      "<p>No user specified and you are not logged in.</p>"
    );
  }

  function fetchUserProfile(username) {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      $("#user-profile").html(
        '<p>You are not logged in. Please <a href="/login">login</a> to view profiles.</p>'
      );
      return;
    }
    $.ajax({
      url: `/api/user/${username}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (user) {
        currentUser = user;
        fetchUserStatus(username).then((isOnline) => {
          user.isOnline = isOnline;

          fetchForumPostCount(user._id).then((postCount) => {
            user.forumPostCount = postCount;

          displayUserProfile(user);
        });

        });
        document.getElementById(
          "profile-title"
        ).textContent = `${user.username}'s Profile - Valkyrie`;
      },
      error: function (xhr, status, error) {
        console.error("Error fetching user profile:", xhr.responseText);
        console.error("Status:", status);
        console.error("Error:", error);
        $("#user-profile").html(
          '<p>Error fetching user profile. Please try again. If the problem persists, please <a href="/login">login</a> again.</p>'
        );
      },
    });
  }

  function fetchUserStatus(username) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/user-status/${username}`,
        method: "GET",
        success: function (response) {
          resolve(response.isOnline);
        },
        error: function (xhr, status, error) {
          console.error("Error fetching user status:", error);
          resolve(false);
        },
      });
    });
  }

  function fetchForumPostCount(userId) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/api/forum/user-post-count/${userId}`,
        method: "GET",
        success: function (response) {
          resolve(response.count);
        },
        error: function (xhr, status, error) {
          console.error("Error fetching forum post count:", error);
          resolve(0); // Default to 0 if there's an error
        },
      });
    });
  }

  function displayUserProfile(user) {
    const isOwnProfile = user.username === localStorage.getItem("username");
    let actionButton = "";
    let onlineStatus = user.isOnline
      ? '<span class="text-success">[ Online ]</span>'
      : '<span class="text-muted">[ Offline ]</span>';

    if (!isOwnProfile) {
      if (user.isFriend) {
        actionButton = `<button id="unfriend" class="btn btn-warning btn-sm"><i class="fa fa-user-times"></i> Unfriend</button>`;
      } else if (user.friendRequestReceived) {
        actionButton = `
          <button id="accept-friend-request" class="btn btn-success btn-sm"><i class="fa fa-check"></i> Accept Friend Request</button>
          <button id="decline-friend-request" class="btn btn-danger btn-sm" style="margin-left: 10px;"><i class="fa fa-times"></i> Decline Friend Request</button>
        `;
      } else if (user.friendRequestSent) {
        actionButton = `<button class="btn btn-secondary btn-sm" disabled><i class="fa fa-clock-o"></i> Friend Request Sent</button>`;
      } else {
        actionButton = `<button id="send-friend-request" class="btn btn-primary btn-sm"><i class="fa fa-user-plus"></i> Send Friend Request</button>`;
      }
      actionButton += `<button id="message-user" class="btn btn-info btn-sm" style="margin-left: 10px;"><i class="fa fa-envelope"></i> Message</button>`;
    }

    const userInfoHtml = `
      <div class="panel panel-primary">
        <div class="panel-heading">
          <h3 class="panel-title">${escapeHtml(user.username)}'s Profile</h3>
        </div>
        <div class="panel-body text-center">
          <p>${onlineStatus}</p>
          <p><a href="https://www.valk.fun/user-profile?username=${encodeURIComponent(
            user.username
          )}">https://www.valk.fun/user-profile?username=${encodeURIComponent(
      user.username
    )}</a></p>
                    <img src="https://kids.kiddle.co/images/6/6e/Roblox_Default_Male_Avatar.png" 
                         alt="${escapeHtml(user.username)}" 
                         class="user-avatar">
                    <div id="blurb-container" style="margin-top: 10px;">
                        <div class="panel panel-default">
                            <div class="panel-body">
                                <p id="blurb-text">${
                                  user.blurb
                                    ? escapeHtml(user.blurb).replace(
                                        /\n/g,
                                        "<br>"
                                      )
                                    : "No blurb set."
                                }</p>
                            </div>
                        </div>
                         ${
                           isOwnProfile
                             ? '<button id="edit-blurb" class="btn btn-default btn-sm"><i class="fa fa-pencil"></i> Edit Blurb</button>'
                             : ""
                         }
                    </div>
                    <div id="action-button-container" style="margin-top: 10px;">${actionButton}</div>
                   
                </div>
            </div>
        `;

    $("#user-info").html(userInfoHtml);


    const statisticsHtml = `
    <div class="panel panel-primary" style="margin-top: 20px;">
      <div class="panel-heading">
        <h3 class="panel-title">User Statistics</h3>
      </div>
      <div class="panel-body">
        <p><strong>Last Seen:</strong> ${formatDate(user.lastLoggedIn)}</p>
        <p><strong>Join Date:</strong> ${formatDate(user.signupDate)}</p>
        <p><strong>Place Visits:</strong>0</p>
        <p><strong>Forum Post Count:</strong> ${user.forumPostCount || 0}</p>
      </div>
    </div>
  `;

  $("#user-info").append(statisticsHtml);


    // Fetch and display friends list
    fetchFriendsList(user.username);
    // Call the new function to display the items panel
    displayItemsPanel(user);
    // Call the new function to display the places panel
    UserGames.displayPlacesPanel(user);
    
    // Initialize actions
    if (!isOwnProfile) {
      initFriendActions(user);
      $("#message-user").on("click", function () {
        window.location.href = `/messages/compose?recipient=${encodeURIComponent(
          user.username
        )}`;
      });
    } else {
      initBlurbEdit(user.blurb);
    }
  }

  function fetchFriendsList(username) {
    Friends.fetchFriendsList(username, "user-friends").catch((error) => {
      console.error("Error fetching friends list:", error);
      $("#user-friends").html("<p>Error loading friends list.</p>");
    });
  }

  // Add a function to periodically update the user's status
  function startStatusUpdates() {
    setInterval(() => {
      if (currentUser) {
        fetchUserStatus(currentUser.username).then((isOnline) => {
          const statusElement = $(".panel-title span");
          if (isOnline) {
            statusElement
              .removeClass("text-muted")
              .addClass("text-success")
              .text("Online");
          } else {
            statusElement
              .removeClass("text-success")
              .addClass("text-muted")
              .text("Offline");
          }
        });
      }
    }, 60000); // Update every minute
  }

  startStatusUpdates();

  function initFriendActions(user) {
    $("#send-friend-request").on("click", function () {
      sendFriendRequest(user._id);
    });

    $("#accept-friend-request").on("click", function () {
      acceptFriendRequest(user._id);
    });

    $("#decline-friend-request").on("click", function () {
      declineFriendRequest(user._id);
    });

    $("#unfriend").on("click", function () {
      unfriend(user._id);
    });
  }

  function checkFriendshipStatus(username) {
    const token = localStorage.getItem("token");
    $.ajax({
      url: `/api/friendship-status/${username}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        fetchUserProfile(username);
      },
      error: function (xhr, status, error) {
        console.error("Error checking friendship status:", error);
      },
    });
  }

  function sendFriendRequest(userId) {
    sendAjaxRequest(
      "/api/send-friend-request/" + userId,
      "POST",
      "Friend request sent successfully"
    );
  }

  function acceptFriendRequest(userId) {
    sendAjaxRequest(
      "/api/accept-friend-request/" + userId,
      "POST",
      "Friend request accepted"
    );
  }

  function declineFriendRequest(userId) {
    sendAjaxRequest(
      "/api/decline-friend-request/" + userId,
      "POST",
      "Friend request declined"
    );
  }

  function unfriend(userId) {
    sendAjaxRequest(
      "/api/unfriend/" + userId,
      "POST",
      "Unfriended successfully"
    );
  }

  function sendAjaxRequest(url, method, successMessage) {
    const token = localStorage.getItem("token");
    $.ajax({
      url: url,
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (response) {
        alert(successMessage);
        checkFriendshipStatus(username);
      },
      error: function (xhr, status, error) {
        if (
          xhr.responseJSON &&
          xhr.responseJSON.error ===
            "You have already received a friend request from this user"
        ) {
          alert(
            "You have already received a friend request from this user. Please check your friend requests."
          );
        } else {
          alert(
            "Error: " +
              (xhr.responseJSON ? xhr.responseJSON.error : "Unknown error")
          );
        }
        checkFriendshipStatus(username);
      },
    });
  }

  function initBlurbEdit(currentBlurb) {
    $("#edit-blurb").on("click", function () {
      const blurbContainer = $("#blurb-container");
      blurbContainer.html(`
                <h4>Edit About Me</h4>
                <textarea id="blurb-textarea" class="form-control" rows="3" maxlength="500">${escapeHtml(
                  currentBlurb || ""
                )}</textarea>
                <p id="char-count">0/500</p>
                <button id="save-blurb" class="btn btn-success btn-sm mt-2">Save</button>
                <button id="cancel-blurb" class="btn btn-secondary btn-sm mt-2">Cancel</button>
            `);

      const textarea = $("#blurb-textarea");
      const charCount = $("#char-count");

      textarea.on("input", function () {
        const remaining = 500 - this.value.length;
        charCount.text(`${this.value.length}/500`);
      });

      textarea.trigger("input");

      $("#save-blurb").on("click", function () {
        let newBlurb = textarea.val().trim();
        newBlurb = newBlurb.replace(/\n+/g, "\n").replace(/^\n|\n$/g, "");
        const token = localStorage.getItem("token");
        $.ajax({
          url: "/api/user/blurb",
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: JSON.stringify({ blurb: newBlurb }),
          success: function (response) {
            currentUser.blurb = response.blurb;
            displayUserProfile(currentUser);
          },
          error: function (xhr, status, error) {
            alert(
              "Error updating blurb: " +
                (xhr.responseJSON ? xhr.responseJSON.error : "Unknown error")
            );
          },
        });
      });

      $("#cancel-blurb").on("click", function () {
        displayUserProfile(currentUser);
      });
    });
  }

  function displayItemsPanel(user) {
    const itemsHtml = `
      <div class="panel panel-primary" style="margin-top: 20px;">
        <div class="panel-heading">
          <h3 class="panel-title">${escapeHtml(user.username)}'s Inventory</h3>
        </div>
        <div class="panel-body">
          <div class="row">
            <div class="col-md-2">
              <ul class="nav nav-pills nav-stacked" role="tablist" style="text-align: center;">
                <li role="presentation" class="active"><a href="#heads" aria-controls="heads" role="tab" data-toggle="tab">Heads</a></li>
                <li role="presentation"><a href="#faces" aria-controls="faces" role="tab" data-toggle="tab">Faces</a></li>
                <li role="presentation"><a href="#gears" aria-controls="gears" role="tab" data-toggle="tab">Gears</a></li>
                <li role="presentation"><a href="#hats" aria-controls="hats" role="tab" data-toggle="tab">Hats</a></li>
                <li role="presentation"><a href="#tshirts" aria-controls="tshirts" role="tab" data-toggle="tab">T-Shirts</a></li>
                <li role="presentation"><a href="#shirts" aria-controls="shirts" role="tab" data-toggle="tab">Shirts</a></li>
                <li role="presentation"><a href="#pants" aria-controls="pants" role="tab" data-toggle="tab">Pants</a></li>
                <li role="presentation"><a href="#decals" aria-controls="decals" role="tab" data-toggle="tab">Decals</a></li>
              </ul>
            </div>
            <div class="col-md-10">
              <div class="tab-content">
                <div role="tabpanel" class="tab-pane active" id="heads">
                  <div class="row">
                    ${generateItemHtml("BlockHead", "https://static.wikia.nocookie.net/roblox/images/f/fe/BlockHead.png", "Roblox", "Free")}
                    ${generateItemHtml("Roundy", "https://static.wikia.nocookie.net/roblox/images/7/71/Roundy1.png", "Roblox", "Free")}
                    ${generateItemHtml("Trim", "https://static.wikia.nocookie.net/roblox/images/c/c9/Trim.png", "Roblox", "Free")}
                    ${generateItemHtml("Diamond", "https://static.wikia.nocookie.net/roblox/images/e/ea/Diamond.png", "Roblox", "142")}
                    ${generateItemHtml("Peabrain", "https://static.wikia.nocookie.net/roblox/images/1/15/PeabrainV2.png", "Roblox", "1,000")}
                  </div>
                </div>
                <div role="tabpanel" class="tab-pane" id="faces">
                  <div class="row">
                    ${generateItemHtml("Face 1", "placeholder-face.jpg", "Roblox", "100")}
                    ${generateItemHtml("Face 2", "placeholder-face.jpg", "Roblox", "150")}
                    ${generateItemHtml("Face 3", "placeholder-face.jpg", "Roblox", "200")}
                  </div>
                </div>
                <div role="tabpanel" class="tab-pane" id="gears">
                  <div class="row">
                    ${generateItemHtml("Gear 1", "placeholder-gear.jpg", "Roblox", "300")}
                  </div>
                </div>
                <div role="tabpanel" class="tab-pane" id="hats">
                  <div class="row">
                    ${generateItemHtml("Hat 1", "https://web.archive.org/web/20100430210534im_/http://t7bg.roblox.com/b86a5b790555d5219ea463bf38c74231", "Roblox", "100")}
                    ${generateItemHtml("Hat 2", "placeholder-hat.jpg", "Roblox", "150")}
                    ${generateItemHtml("Hat 3", "placeholder-hat.jpg", "Roblox", "200")}
                  </div>
                </div>
                <div role="tabpanel" class="tab-pane" id="tshirts">
                  <div class="row">
                    ${generateItemHtml("T-shirt 1", "placeholder-tshirt.jpg", "Roblox", "50")}
                    ${generateItemHtml("T-shirt 2", "placeholder-tshirt.jpg", "Roblox", "75")}
                  </div>
                </div>
                <div role="tabpanel" class="tab-pane active" id="shirts">
                  <div class="row" id="user-shirts"></div>
                </div>
                <div role="tabpanel" class="tab-pane" id="pants">
                  <div class="row">
                    ${generateItemHtml("Pants 1", "placeholder-pants.jpg", "Roblox", "80")}
                    ${generateItemHtml("Pants 2", "placeholder-pants.jpg", "Roblox", "90")}
                  </div>
                </div>
                <div role="tabpanel" class="tab-pane" id="decals">
                  <div class="row">
                    ${generateItemHtml("Decal 1", "placeholder-decal.jpg", "Roblox", "25")}
                    ${generateItemHtml("Decal 2", "placeholder-decal.jpg", "Roblox", "30")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  
    $("#user-items-panel").html(itemsHtml);
  
    // Load user's shirts
    loadUserShirts(user._id);

    // Initialize Bootstrap tabs
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      // You can add logic here to load items dynamically if needed
   //   console.log('Tab switched to: ' + $(e.target).attr('href'));
    });
  }

  function loadUserShirts(userId) {
    $.ajax({
      url: `/api/shirts/user/id/${userId}`, // Updated URL
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      success: function(shirts) {
        displayUserShirts(shirts);
      },
      error: function(xhr, status, error) {
        console.error('Error fetching user shirts:', error);
        $('#user-shirts').html('<p>Error loading your shirts. Please try again later.</p>');
      }
    });
  }

  function displayUserShirts(shirts) {
    const shirtsContainer = $('#user-shirts');
    shirtsContainer.empty();

    if (shirts.length === 0) {
        shirtsContainer.append('<p>No shirts available.</p>');
        return;
    }

    shirts.forEach(shirt => {
        const shirtHtml = generateItemHtml(shirt.Name, shirt.ThumbnailLocation, shirt.creator.username, shirt.Price);
        shirtsContainer.append(shirtHtml);
    });
}
  
  function generateItemHtml(name, imageSrc, creator, price) {
    const priceDisplay = price === "Free" ? "Free" : `$${price}`;
    return `
      <div class="col-lg-3 col-md-4 col-sm-6 col-xs-6 text-center mb-3">
        <div class="item-card center-block">
          <div class="thumbnail" style="width: 100%; max-width: 150px; height: 150px; overflow: hidden; margin: 0 auto;">
            <img src="${imageSrc}" alt="${name}" class="img-responsive center-block" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div class="caption">
            <h4 class="text-center">${name}</h4>
            <p class="text-center"><b>Creator:</b> ${creator}</p>
            <p class="text-center"><b>Price:</b> ${priceDisplay}</p>
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
