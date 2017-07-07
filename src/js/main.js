/**
 * Created by ankit on 7/3/17.
 */


// selecters to be used in code below
var bell = $('.bell');

// constants
var api_url = "http://localhost:5660";


// notification actions id array, we will need it while updating notification status
window.n_action_id = [];

window.notification_panel_status = "hidden";


var compare_n_data = function (array_1, array_2) {
    if (array_1.length != array_2.length) return false;
    for (var i = 0; i < array_2.length; i++) {
        if (array_1[i].sender_count !== array_2[i].sender_count) {
            return false;
        }
    }
    return true;
};


//GET request to fetch logged in user

var get_logged_user = function (callback) {
    var route_url = "/me";
    var loggedin_user_url = api_url + route_url;
    $.get(loggedin_user_url, callback);
};

// GET request to fetch notifications from server
var get_notifications = function (callback) {
    var route_url = "/notification";
    var list_n_url = api_url + route_url;
    $.get(list_n_url, function (data, status) {
        console.log(data, status);
        if (status == "success") {
            if (data.error === 0) {
                JSON_data = data;
                callback(0, JSON_data.message);
            }
            else {
                console.log(data.message);
            }
        }
        else {
            callback(status);
        }
    });
};


// POST request to update status of unread notifications as read
var update_n_status = function (data, callback) {
    var route_url = "/notification";
    var update_n_status_url = api_url + route_url;
    $.post(update_n_status_url, data, callback).fail(callback);
};


// Update notification count.
var update_n_count = function (count) {
    if (typeof count === 'number') {
        var status = $('.n_count');
        status.html(count);
        if (count === 0) {
            status.hide();
        }
        else {
            status.show();
        }
    }
    else {
        throw "'update_n_count' expects an integer value as argument";
    }
};


// Update Notification Panel with notification details
var update_notification_DOM = function (n_data) {

    if (n_data !== undefined && n_data.length >= 1) {
        var n_obj_array = [];
        n_data.forEach(function (notification) {
            obj = {};
            obj.image = api_url + "/static/img/" + notification.sender[0].profile_img;
            if (notification.sender_count === 1) {
                obj.user = notification.sender[0].name;
            }
            else if (notification.sender_count === 2) {
                obj.user = notification.sender[0].name;
                obj.user = obj.user + " and " + String(notification.sender_count - 1) + " other";
            }
            else if (notification.sender_count >= 2) {
                obj.user = notification.sender[0].name;
                obj.user = obj.user + " and " + String(notification.sender_count - 1) + " others";
            }
            obj.action = notification.action.description;
            n_obj_array.push(obj);
        });

        var html = " <p>Notifications </p>\
        <span class='n_count'></span>";
        n_obj_array.forEach(function (n_obj) {
            var str = "<li><span class='n_img_wrapper'>\
        <img src='" + n_obj.image + "' >\
            </span>\
            <span class='users'> " + n_obj.user + "</span>\
        <span class='action'>" + n_obj.action + "</span></li>";
            html = html + str;
        });
        $(".n_details_wrapper").html(html);
        console.log("Notification DOM updated");
    }
    else {
        var html = " <p>Notifications </p>\
        <span class='n_count'></span>";

        html = html + "" +
            "<li style='text-align: center'><span class='users'> All caught up!</span></li>";
        $(".n_details_wrapper").html(html);


    }
};


// update client side notifications by fetching
// new notifications from server and updating DOM
var update_notification = function () {
    get_notifications(function (err_status, JSON_res) {
        if (err_status) {
            console.log("Unable to get notes, return status from server: " + err_status);
        }
        else {
            var notification_count = JSON_res.notification_count;
            var notifications_data = JSON_res.data;
            if (window.notification_panel_status === "hidden") {
                if (notification_count != 0) {
                    if (window.notification_data) {
                        var is_equal = compare_n_data(window.notification_data, notifications_data);
                        if (is_equal != true) {
                            $.toast({
                                text: "You have some new notifications",
                                hideAfter: 2000,
                                bgColor: 'blue'
                            });
                        }

                    }
                    else {
                        $.toast({
                            text: "You have some new notifications",
                            hideAfter: 2000,
                            bgColor: 'blue'
                        });
                    }
                }
                update_notification_DOM(notifications_data);

                update_n_count(notification_count);
                update_n_action_id(notifications_data);
                window.notification_data = notifications_data;
            }
            else {
                update_n_count(notification_count);
                update_n_action_id(notifications_data);
            }
        }
    })
};

var get_post_data = function () {
    if (n_action_id.length === 0) {
        return false;
    }
    else {
        return {
            action_keys: n_action_id.join(",")
        };
    }

};

var update_n_action_id = function (n_data) {
    window.n_action_id = [];
    n_data.forEach(function (notification) {
        window.n_action_id.push(notification.action._id);
    })
};

var remove_animation = function () {
    var notification_panel = $('.notification_panel');
    notification_panel.removeClass("fadeInAnimation");

};

var show_notification_panel = function () {
    var notification_panel = $('.notification_panel');
    notification_panel.show().addClass("fadeInAnimation");
    setTimeout(remove_animation, 1000);
    window.notification_panel_status = "visible";
};

var hide_notification_panel = function () {
    var notification_panel = $('.notification_panel');
    notification_panel.hide();
    window.notification_panel_status = "hidden";
    update_notification_DOM(window.notification_data);
};

$(window).click(function (event) {
    var parents_len = $(event.target).parents(".notification_panel").length;
    if (parents_len === 0 && $(event.target).attr("id") != "read") {
        hide_notification_panel();
    }
});

bell.click(function () {

    if (window.server_status != "disconnected") {
        if (window.notification_panel_status == "hidden") {
            show_notification_panel();
            if (get_post_data()) {
                update_n_status(get_post_data(), function (data, status) {
                    if (status === "success") {
                        if (data.error === 0) {
                            console.log(data.message);
                            update_n_count(0);
                            clearInterval(window.update_interval_id);
                            setTimeout(trigger_updates, 3000);
                        }
                        else {
                            console.log(data.message);
                        }
                    }
                    else {
                        console.log("POST request failed, error: " + status);
                    }
                })
            }
        }
        else {
            hide_notification_panel();
        }
    }
    else {
        if (window.notification_panel_status === "visible") {
            hide_notification_panel();
        }
        alert("Unable to fetch notifications. Not connected to server.");
    }
});

var update_user_DOM = function (data) {
    var img = data.profile_img;
    var img_url = api_url + "/static/img/" + img;
    $(".profile_img").attr('src', img_url);
};


var update_loggedin_user = function () {
    get_logged_user(function (data, status) {
        if (status === "success") {
            if (data.error === 0) {
                update_user_DOM(data.data);
                $.toast({
                    text: "Logged in user is " + data.data.name,
                    hideAfter: 3000,
                    bgColor: 'green'
                });
            }
            else {
                console.log(data.message);
            }
        }
        else {
            console.log("GET request failed with status: " + status);
        }
    })
};


var trigger_updates = function () {
    update_notification();

    window.update_interval_id = setInterval(update_notification, 5000);
};

var init = function () {
    update_loggedin_user();
    trigger_updates();
};

window.server_status = "disconnected";

var server_availability_check = function () {
    var xmlHttp = new XMLHttpRequest();
    try {
        xmlHttp.onreadystatechange = function () {
            console.log(xmlHttp);
            if (xmlHttp.readyState == 4 && xmlHttp.status == 0) {
                clearInterval(window.update_interval_id);
                window.server_status = "disconnected";
                $.toast({
                    text: "Unable to connect to server. Retrying in 5 sec...",
                    hideAfter: 5000,
                    bgColor: 'red'
                });
            }
            else if (xmlHttp.readyState == 4) {
                if (window.server_status === "disconnected") {
                    console.log("Connected to server");
                    $.toast({
                        text: "Connected to server",
                        hideAfter: 1500,
                        bgColor: 'green'
                    });
                    init();
                    window.server_status = "connected";
                }

            }
        };
        xmlHttp.open("GET", "http://localhost:5660/me", true);
        xmlHttp.send();
    } catch (error) {
        console.log('error caught: ', error);
    }
};

server_availability_check();
window.server_check_interval_id = setInterval(server_availability_check, 5000);

