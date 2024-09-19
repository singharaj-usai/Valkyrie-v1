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
          displayUserProfile(user);
        });
        document.getElementById(
          "profile-title"
        ).textContent = `${user.username}'s Profile - AlphaBlox`;
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

  function displayUserProfile(user) {
    const isOwnProfile = user.username === localStorage.getItem("username");
    let actionButton = "";
    let onlineStatus = user.isOnline
      ? '<span class="text-success"><i class="bi bi-circle-fill"></i> Online</span>'
      : '<span class="text-danger"><i class="bi bi-circle-fill"></i> Offline</span>';

    if (!isOwnProfile) {
      if (user.isFriend) {
        actionButton = `<button id="unfriend" class="btn btn-warning btn-sm">Unfriend</button>`;
      } else if (user.friendRequestReceived) {
        actionButton = `
                    <button id="accept-friend-request" class="btn btn-success btn-sm">Accept Friend Request</button>
                    <button id="decline-friend-request" class="btn btn-danger btn-sm">Decline Friend Request</button>
                `;
      } else if (user.friendRequestSent) {
        actionButton = `<button class="btn btn-secondary btn-sm" disabled>Friend Request Sent</button>`;
      } else {
        actionButton = `<button id="send-friend-request" class="btn btn-primary btn-sm">Send Friend Request</button>`;
      }
      actionButton += `<button id="message-user" class="btn btn-info btn-sm">Message</button>`;
    }

    const userInfoHtml = `
    <div class="panel panel-primary">
                <div class="panel-heading">
                    <h3 class="panel-title">${escapeHtml(
                      user.username
                    )}'s Profile</h3>
                </div>
                <div class="panel-body text-center">
                    <p>${onlineStatus}</p>
                    <p><a href="https://www.alphablox.net/user-profile?username=${encodeURIComponent(
                      user.username
                    )}">https://www.alphablox.net/user-profile?username=${encodeURIComponent(
      user.username
    )}</a></p>
                    <img src="https://via.placeholder.com/200x200.png?text=${encodeURIComponent(
                      user.username[0]
                    )}" 
                         alt="${escapeHtml(user.username)}" 
                         class="img-circle user-avatar">
                    <div id="action-button-container">${actionButton}</div>
                    <div id="blurb-container" class="mt-3">
                        <h4>About Me</h4>
                       <p id="blurb-text">${user.blurb ? escapeHtml(user.blurb).replace(/\n/g, '<br>') : "No blurb set."}</p>
                        ${
                          isOwnProfile
                            ? '<button id="edit-blurb" class="btn btn-default btn-sm">Edit Blurb</button>'
                            : ""
                        }
                    </div>
                </div>
            </div>
        `;

    $("#user-info").html(userInfoHtml);

    // Fetch and display friends list
    fetchFriendsList();

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

  function fetchFriendsList() {
    const token = localStorage.getItem("token");
    $.ajax({
      url: "/api/friends",
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (friends) {
        const friendsList = $("#user-friends");
        let html = `
<div class="panel panel-primary">
                        <div class="panel-heading">
                            <h3 class="panel-title">Friends</h3>
                        </div>
                        <div class="panel-body">
                `;

        if (friends.length === 0) {
          html += "<p>No friends yet.</p>";
        } else {
          html += '<div class="row">';
          friends.forEach(function (friend) {
            html += `
                            <div class="col-xs-6 col-sm-4 col-md-3 text-center mb-3">
                                <a href="/user-profile?username=${encodeURIComponent(
                                  friend.username
                                )}" title="${escapeHtml(friend.username)}">
                                    <img src="https://via.placeholder.com/100x100.png?text=${encodeURIComponent(
                                      friend.username[0]
                                    )}" 
                                         alt="${escapeHtml(friend.username)}" 
                                         class="img-circle" 
                                         style="width: 100px; height: 100px;">
                                </a>
                                <p class="mt-2">
                                    <a href="/user-profile?username=${encodeURIComponent(
                                      friend.username
                                    )}" title="${escapeHtml(friend.username)}">
                                        ${escapeHtml(friend.username)}
                                    </a>
                                </p>
                            </div>
                        `;
          });
          html += "</div>";
        }

        html += "</div></div>";
        friendsList.html(html);
      },
      error: function (xhr, status, error) {
        console.error("Error fetching friends list:", error);
        $("#user-friends").html("<p>Error loading friends list.</p>");
      },
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
        newBlurb = newBlurb.replace(/\n+/g, '\n').replace(/^\n|\n$/g, '');
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

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
