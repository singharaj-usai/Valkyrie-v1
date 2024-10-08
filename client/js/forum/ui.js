
function displayPosts(posts, containerId = '#recent-posts') {
    const postsContainer = $(containerId);
    postsContainer.empty();

    const sections = {};

    posts.forEach(post => {
        if (!sections[post.section]) {
            sections[post.section] = [];
        }
        sections[post.section].push(post);
    });

    //  order of sections
    const sectionOrder = ['announcements', 'change-log', 'suggestions-and-ideas', 'media', 'asset-sharing', 'tutorials', 'general', 'game-dev', 'support', 'off-topic', 'rate-my-character', 'memes'];

    sectionOrder.forEach(sectionId => {
        if (sections[sectionId] && sections[sectionId].length > 0) {
            const sectionPosts = sections[sectionId];
            const sectionName = getSectionName(sectionId);

            const sectionTable = $(`
                <div class="panel panel-primary">
                    <div class="panel-heading">
                        <h3 class="panel-title">${sectionName}</h3>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th style="width: 30%">Topic</th>
                                    <th style="width: 20%">Author</th>
                                    <th style="width: 10%">Replies</th>
                                    <th style="width: 20%">Posted On</th>
                                    <th style="width: 20%">Last Reply</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>
                </div>
            `);

            const tableBody = sectionTable.find('tbody');

                 sectionPosts.forEach(post => {
                const replyCount = post.replies ? post.replies.length : 0;
                const lastReply = post.replies && post.replies.length > 0 ? post.replies[post.replies.length - 1] : null;

                const postedOn = new Date(post.createdAt).toLocaleString();
                const lastReplyDate = lastReply ? new Date(lastReply.createdAt).toLocaleString() : 'N/A';
                const lastReplyAuthor = lastReply ? escapeHtml(lastReply.author.username) : 'N/A';


                const row = $(`
                    <tr>
                        <td>
                            ${post.isPinned ? '<i class="fa fa-thumbtack text-warning" title="Pinned Post"></i> ' : ''}
                            <a href="/forum/post?id=${post._id}">${escapeHtml(post.title)}</a>
                        </td>
                        <td>
                            <a href="/user-profile?username=${post.author.username}">${escapeHtml(post.author.username)}</a>
                        </td>
                        <td>${replyCount}</td>
                        <td>${postedOn}</td>
                        <td>
                            ${lastReplyDate !== 'N/A' ? `${lastReplyDate}<br>by <a href="/user-profile?username=${lastReplyAuthor}">${lastReplyAuthor}</a>` : 'N/A'}
                        </td>
                    </tr>
                `);

                tableBody.append(row);
            });

            postsContainer.append(sectionTable);
        }
    });
}

function displayPagination(totalPages, currentPage, section) {
    const pagination = $('#pagination');
    pagination.empty();

    if (totalPages <= 1) return;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (currentPage > 1) {
        pagination.append(`<li><a href="?page=${currentPage - 1}">&laquo;</a></li>`);
    }

    for (let i = startPage; i <= endPage; i++) {
        pagination.append(`<li class="${i === currentPage ? 'active' : ''}"><a href="?page=${i}">${i}</a></li>`);
    }

    if (currentPage < totalPages) {
        pagination.append(`<li><a href="?page=${currentPage + 1}">&raquo;</a></li>`);
    }
}

function initNewPostForm() {
    // Add breadcrumbs
    const breadcrumb = $('#post-breadcrumb');
    breadcrumb.html(`
        <li><a href="/forum/home">Forum Home</a></li>
        <li class="active">Create New Post</li>
    `);

    const sectionSelect = $('#post-section');
    forumSections.forEach(section => {
        if (section.id !== 'all') {
            sectionSelect.append(`<option value="${section.id}">${section.name}</option>`);
        }
    });

    $('#new-post-form').submit(function(e) {
        e.preventDefault();
        const title = $('#post-title').val().trim();
        const section = $('#post-section').val();
        const content = $('#post-content').val().trim();

        // List of bad words
        const badWords = [
            "nlgga", "nigga", "sex", "raping", "tits", "wtf", "vag", "diemauer", "brickopolis", ".com", ".cf", "dicc", "nude",
            "kesner", "nobe", "idiot", "dildo", "cheeks", "anal", "boob", "horny", "tit", "fucking", "gay", "rape",
            "rapist", "incest", "beastiality", "cum", "maggot", "bloxcity", "bullshit", "fuck", "penis", "dick",
            "vagina", "faggot", "fag", "nigger", "asshole", "shit", "bitch", "stfu", "cunt", "pussy", "hump",
            "meatspin", "redtube", "porn", "kys", "xvideos", "hentai", "gangbang", "milf", "whore", "cock",
            "masturbate", "arse", "bastard", "bollocks", "damn", "piss", "twat", "wanker", "slut", "motherfucker",
            "dickhead", "prick", "spunk", "tosser", "arsehole", "bellend", "knobhead", "minge", "munter", "sod",
            "bugger", "feck", "flange", "jizz", "knob", "muff", "quim", "shag", "skank", "slag", "spastic", "turd",
            "wank", "pedo", "pedophile", "lolita", "loli", "shota", "futa", "futanari", "ecchi", "ahegao", "bukakke",
            "creampie", "rimjob", "blowjob", "handjob", "footjob", "fellatio", "cunnilingus", "anilingus", "smegma",
            "scat", "golden shower", "cleveland steamer", "rusty trombone", "dirty sanchez", "alabama hot pocket",
            "donkey punch", "pearl necklace", "money shot", "facial", "scissoring", "tribadism", "fisting", "pegging",
            "bdsm", "bondage", "dominatrix", "submissive", "masochist", "sadist", "fetish", "kink", "orgy", "swingers",
            "cuckold", "hotwife", "throatpie", "deepthroat", "gape", "prolapse", "sounding", "felching", "snowballing",
            "teabagging", "queef", "squirt", "grool", "creampie", "bukkake", "gokkun", "goatse", "tubgirl", "blumpkin",
            "arse", "arsehole", "ass", "asshat", "asshole", "asswipe", "ballsack", "bastard", "beaner", "bitch",
            "blowjob", "bollocks", "boner", "bullshit", "butthole", "chink", "clusterfuck", "cocksucker", "cracker",
            "crap", "cumshot", "dago", "damn", "douchebag", "dyke", "fag", "faggot", "feck", "fellate", "fellatio",
            "felching", "fuck", "fudgepacker", "flange", "goddamn", "homo", "jizz", "kike", "knobend",
            "kraut", "kunt", "kyke", "mick", "minge", "motherfucker", "munter", "nigger", "nigga", "paki", "piss",
            "pissed", "prick", "pube", "pussy", "queer", "scrotum", "shit", "shithead", "slut", "smegma", "spic",
            "spunk", "tosser", "turd", "twat", "vittu", "wank", "wanker", "whore", "wog"
        ];

        // Create a regex pattern with word boundaries
        const regex = new RegExp(`\\b(${badWords.join('|')})\\b`, 'i');

        if (regex.test(content) || regex.test(title)) {
            $('#alert-container').html(`
                <div class="alert alert-danger" role="alert">
                    Your post title or content contains inappropriate language. Please remove the bad words and try again.
                </div>
            `);
            return;
        } else {
            $('#alert-container').empty();
        }

        $.ajax({
            url: '/api/forum/posts',
            method: 'POST',
            data: JSON.stringify({ title, section, content }),
            contentType: 'application/json',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            success: function(response) {
                $('#alert-container').html(`
                    <div class="alert alert-success" role="alert">
                        Post submitted successfully!
                    </div>
                `);
                
                setTimeout(function() {
                    window.location.href = '/forum/home';
                }, 3000); // Wait for 3 seconds before redirecting
            },
            error: function(xhr, status, error) {
                console.error('Error submitting post:', error);
                if (xhr.status === 400 && xhr.responseJSON && xhr.responseJSON.message) {
                    $('#alert-container').html(`
                        <div class="alert alert-danger" role="alert">
                            ${escapeHtml(xhr.responseJSON.message)}
                        </div>
                    `);
                } else if (xhr.status === 401) {
                    alert('You must be logged in to create a post. Please log in and try again.');
                    window.location.href = '/login';
                } else {
                    alert('Error submitting post. Please try again later.');
                }
            }
        });
    });
}

function updateBreadcrumbs(post) {
    const breadcrumb = $('#reply-breadcrumb');
    breadcrumb.html(`
        <li><a href="/forum/home">Forum Home</a></li>
        <li><a href="/forum/sections/${post.section}">${getSectionName(post.section)}</a></li>
        <li><a href="/forum/post?id=${post._id}">${escapeHtml(post.title)}</a></li>
        <li class="active">Reply</li>
    `);
}

function setupReplyForm(postId) {
    $('#reply-form').on('submit', function(e) {
        e.preventDefault();
        const content = $('#reply-content').val();
        submitReply(postId, content);
    });
}