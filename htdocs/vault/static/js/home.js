(function() {
    function App() {
        this.data = null;
        this.passphrase = null;
        this.trigger = null;
    }

    App.prototype.decrypt = function(message, password) {
        var sPassword = app.padRight(password, 32);
        var sIV = message.substring(0, 32);
        var sMessage = message.substring(32);

        v = CryptoJS.AES.decrypt(
            {
                ciphertext: CryptoJS.enc.Hex.parse(sMessage),
                salt: ""
            },
            CryptoJS.enc.Hex.parse(app.toHex(sPassword)),
            {
                iv: CryptoJS.enc.Hex.parse(sIV)
            }
        );

        return app.trimTerminating(v.toString(CryptoJS.enc.Utf8));
    }

    App.prototype.encrypt = function(message, password) {
        var sPassword = app.padRight(password, 32);

        var v = CryptoJS.AES.encrypt(
            message,
            CryptoJS.enc.Hex.parse(app.toHex(sPassword)),
            {
                iv: CryptoJS.enc.Hex.parse(app.toHex(app.serializableIV()))
            }
        );

        return v.iv.toString() + v.ciphertext.toString();
    };

    App.prototype.init = function() {
        var top = $("#chrome");

        // search pop-over
        (function() {
            var top = $("#search");

            var form = $("<form>");
            form.submit(function() {
                $("#home")[0].scrollTop = 0;
                var q = $.trim($("#search form input").val().toLowerCase());
                var re = new RegExp(q);
                $("#home ul li").each(function(i, e) {
                    e = $(e);
                    if (re.test(e.attr("data-key").toLowerCase())) {
                        e.show();
                    } else {
                        e.hide();
                    }
                });
                $("#find").attr("data-filtered", "true");
                $("#find").html("Clear");
                $("#search").hide();
                $("#search input").val("");
                return false;
            });
            top.append(form);

            var p = $("<p>");
            p.addClass("cancel");
            form.append(p);

            var span = $("<span>");
            span.click(function() {
                $("#search input").val("");
                $("#search").hide();
            });
            span.html("&times;");
            p.append(span);

            p = $("<p>");
            form.append(p);

            var input = $("<input>");
            input.attr("id", "q");
            input.attr("type", "text");
            p.append(input);

            p = $("<p>");
            form.append(p);

            var button = $("<button>");
            button.attr("type", "submit");
            button.html("Find");
            p.append(button);

        })();

        // home panel
        (function(top) {
            var panel = $("<div>");
            panel.addClass("panel");
            panel.attr("id", "home");
            top.append(panel);

            var ul = $("<ul>");
            panel.append(ul);

            app.setList();
        })(top);

        // view panel
        (function(top) {
            var panel = $("<div>");
            panel.addClass("panel");
            panel.addClass("stageRight");
            panel.attr("id", "view");
            top.append(panel);

            var content = $("<div>");
            content.addClass("content");
            panel.append(content);
        })(top);

        // edit panel
        (function(top) {
            var panel = $("<div>");
            panel.addClass("panel");
            panel.addClass("stageRight");
            panel.attr("id", "edit");
            top.append(panel);

            var form = $("<form>");
            form.submit(function() {
                
                $("#edit .error").hide();

                var k = $("#edit").attr("data-key");
                var d = app.data[k];

                if (d["typename"] == "web") {

                    var url = $.trim($("#edit_url").val());
                    var username = $.trim($("#edit_username").val());
                    var password = $.trim($("#edit_password").val());
                    var note = $.trim($("#edit_note").val());

                    if (url == "") {
                        $("#edit .error").html("URL required.").show();
                        return false;
                    }

                    if (username == "") {
                        $("#edit .error").html("Username required.").show();
                        return false;
                    }

                    if (password == "") {
                        $("#edit .error").html("Password required.").show();
                        return false;
                    }

                    d["url"] = url;
                    d["username"] = username;
                    d["password"] = password;
                    d["note"] = note;

                } else if (d["typename"]) {

                    var note = $.trim($("#edit_note").val());

                    if (note == "") {
                        $("#edit .error").html("Note required.").show();
                        return false;
                    }

                    d["note"] = note;

                }

                d["modified"] = new Date().toISOString();
                app.data[k] = d;
                app.trigger = "edit";
                app.push();

                return false;
            });
            panel.append(form);
        })(top);

        // add panel
        (function(top) {
            var panel = $("<div>");
            panel.addClass("panel");
            panel.addClass("stageRight");
            panel.attr("id", "add");
            top.append(panel);

            var form = $("<form>");
            form.submit(function() {

                $("#add .error").hide();

                var name = $.trim($("#add_name").val());
                if (name == "") {
                    $("#add .error").html("Name required.").show();
                    return false;
                }

                var map = {};
                for (k in app.data) {
                    map[k.toLowerCase()] = k;
                }

                if (name.toLowerCase() in map) {
                    $("#add .error").html("Name already exists.").show();
                    return false;
                }

                var d = {};
                var typename = $("#add_typename").val();
                
                if (typename == "web") {

                    var url = $.trim($("#add_url").val());
                    var username = $.trim($("#add_username").val());
                    var password = $.trim($("#add_password").val());
                    var note = $.trim($("#add_note").val());

                    if (url == "") {
                        $("#add .error").html("URL required.").show();
                        return false;
                    }

                    if (username == "") {
                        $("#add .error").html("Username required.").show();
                        return false;
                    }

                    if (password == "") {
                        $("#add .error").html("Password required.").show();
                        return false;
                    }

                    d["typename"] = typename;
                    d["typetext"] = "Web Login";
                    d["name"] = name;
                    d["url"] = url;
                    d["username"] = username;
                    d["password"] = password;
                    d["note"] = note;

                } else if (typename == "note") {

                    var note = $.trim($("#add_note").val());

                    if (note == "") {
                        $("#add .error").html("Note required.").show();
                        return false;
                    }

                    d["typename"] = typename;
                    d["typetext"] = "Note";
                    d["name"] = name;
                    d["note"] = note;
                }

                d["modified"] = new Date().toISOString();
                app.data[name] = d;
                app.trigger = "add";
                app.push();

                return false;
            });
            panel.append(form);

            var p = $("<p>");
            p.addClass("error");
            form.append(p);

            p = $("<p>");
            p.addClass("label");
            form.append(p);

            var label = $("<label>");
            label.attr("for", "add_typename");
            label.html("Type");
            p.append(label);

            p = $("<p>");
            p.addClass("value");
            form.append(p);

            var select = $("<select>");
            select.attr("id", "add_typename");
            select.change(function() {
                app.setAdd($(this).val());
            });
            p.append(select);

            var option = $("<option>");
            option.attr("value", "web");
            option.html("Web Login");
            select.append(option);

            option = $("<option>");
            option.attr("value", "note");
            option.html("Note");
            select.append(option);

            var fieldset = $("<fieldset>");
            fieldset.attr("id", "add_fieldset");
            form.append(fieldset);

            app.setAdd("web");
        })(top);

        // menu
        (function(top) {
            var menu = $("<div>");
            menu.attr("id", "menu");
            top.append(menu);

            var viewport = $("<div>");
            viewport.addClass("viewport");
            menu.append(viewport);

            // home
            menu = $("<div>");
            menu.addClass("menu");
            menu.addClass("home");
            viewport.append(menu);

            var span = $("<span>");
            span.addClass("button");
            span.addClass("add");
            span.html("Add");
            span.click(function() {
                app.setAdd("web");
                $("#add")[0].scrollTop = 0;
                $("#home").addClass("stageLeft");
                $("#menu .viewport .menu.home").addClass("stageLeft");
                $("#add").removeClass("stageRight");
                $("#menu .viewport .menu.add").removeClass("stageRight");
            });
            menu.append(span);

            span = $("<span>");
            span.addClass("button");
            span.addClass("blank");
            span.html("&nbsp;");
            menu.append(span);

            span = $("<span>");
            span.addClass("button");
            span.addClass("find");
            span.attr("data-filtered", "false");
            span.attr("id", "find");
            span.html("Find");
            span.click(function() {
                var filtered = $(this).attr("data-filtered") == "true";
                if (filtered) {
                    $("#home")[0].scrollTop = 0;
                    $("#home ul li").show();
                    $("#find").attr("data-filtered", "false");
                    $("#find").html("Find");
                } else {
                    $("#search").show();
                }
            });
            menu.append(span);

            // view
            menu = $("<div>");
            menu.addClass("menu");
            menu.addClass("view");
            menu.addClass("stageRight");
            viewport.append(menu);

            span = $("<span>");
            span.addClass("button");
            span.addClass("back");
            span.html("Back");
            span.click(function() {
                $("#view").addClass("stageRight");
                $("#menu .viewport .menu.view").addClass("stageRight");
                $("#home").removeClass("stageLeft");
                $("#menu .viewport .menu.home").removeClass("stageLeft");
            });
            menu.append(span);

            span = $("<span>");
            span.addClass("button");
            span.addClass("edit");
            span.html("Edit");
            span.click(function() {

                var k = $("#view").attr("data-key");
                var d = app.data[k];

                $("#edit").attr("data-key", k);

                var form = $("#edit form").empty();

                var h3 = $("<h3>");
                h3.html(d["name"]);
                form.append(h3);

                var p = $("<p>");
                p.addClass("error");
                form.append(p);

                if (d["typename"] == "web") {

                    p = $("<p>");
                    p.addClass("label");
                    form.append(p);

                    var label = $("<label>");
                    label.attr("for", "edit_url");
                    label.html("URL");
                    p.append(label);

                    p = $("<p>");
                    p.addClass("value");
                    form.append(p);

                    var input = $("<input>");
                    input.attr("type", "text");
                    input.attr("autocorrect", "off");
                    input.attr("autocapitalize", "off");
                    input.attr("id", "edit_url");
                    input.val(d["url"]);
                    p.append(input);

                    p = $("<p>");
                    p.addClass("label");
                    form.append(p);

                    label = $("<label>");
                    label.attr("for", "edit_username");
                    label.html("Username");
                    p.append(label);

                    p = $("<p>");
                    p.addClass("value");
                    form.append(p);

                    input = $("<input>");
                    input.attr("type", "text");
                    input.attr("autocorrect", "off");
                    input.attr("autocapitalize", "off");
                    input.attr("id", "edit_username");
                    input.val(d["username"]);
                    p.append(input);

                    p = $("<p>");
                    p.addClass("label");
                    form.append(p);

                    label = $("<label>");
                    label.attr("for", "edit_password");
                    label.html("Password");
                    p.append(label);

                    p = $("<p>");
                    p.addClass("value");
                    form.append(p);

                    input = $("<input>");
                    input.attr("type", "text");
                    input.attr("autocorrect", "off");
                    input.attr("autocapitalize", "off");
                    input.attr("id", "edit_password");
                    input.val(d["password"]);
                    p.append(input);

                    p = $("<p>");
                    p.addClass("label");
                    form.append(p);

                    label = $("<label>");
                    label.attr("for", "edit_note");
                    label.html("Note");
                    p.append(label);

                    p = $("<p>");
                    p.addClass("value");
                    form.append(p);

                    input = $("<textarea>");
                    input.attr("id", "edit_note");
                    input.attr("rows", "12");
                    input.val(d["note"]);
                    p.append(input);

                } else if (d["typename"] == "note") {

                    p = $("<p>");
                    p.addClass("label");
                    form.append(p);

                    var label = $("<label>");
                    label.attr("for", "edit_note");
                    label.html("Note");
                    p.append(label);

                    p = $("<p>");
                    p.addClass("value");
                    form.append(p);

                    var input = $("<textarea>");
                    input.attr("id", "edit_note");
                    input.attr("rows", "16");
                    input.val(d["note"]);
                    p.append(input);

                }

                $("#edit")[0].scrollTop = 0;

                $("#view").addClass("stageLeft");
                $("#menu .viewport .menu.view").addClass("stageLeft");
                $("#edit").removeClass("stageRight");
                $("#menu .viewport .menu.edit").removeClass("stageRight");

            });
            menu.append(span);

            span = $("<span>");
            span.addClass("button");
            span.addClass("delete");
            span.html("Delete");
            span.click(function() {
                if (confirm("Delete?")) {
                    var k = $("#view").attr("data-key");
                    delete app.data[k];
                    app.trigger = "delete";
                    app.push();
                }
            });
            menu.append(span);

            // edit
            menu = $("<div>");
            menu.addClass("menu");
            menu.addClass("edit");
            menu.addClass("stageRight");
            viewport.append(menu);

            span = $("<span>");
            span.addClass("button");
            span.addClass("back");
            span.html("Back");
            span.click(function() {
                $("#view")[0].scrollTop = 0;
                $("#edit").addClass("stageRight");
                $("#menu .viewport .menu.edit").addClass("stageRight");
                $("#view").removeClass("stageLeft");
                $("#menu .viewport .menu.view").removeClass("stageLeft");
            });
            menu.append(span);

            span = $("<span>");
            span.addClass("button");
            span.addClass("blank");
            span.html("&nbsp;");
            menu.append(span);

            span = $("<span>");
            span.addClass("button");
            span.addClass("save");
            span.html("Save");
            span.click(function() {
                $("#edit form").submit();
            });
            menu.append(span);

            // add
            menu = $("<div>");
            menu.addClass("menu");
            menu.addClass("add");
            menu.addClass("stageRight");
            viewport.append(menu);

            span = $("<span>");
            span.addClass("button");
            span.addClass("back");
            span.html("Back");
            span.click(function() {
                app.setAdd("web");
                $("#add").addClass("stageRight");
                $("#menu .viewport .menu.add").addClass("stageRight");
                $("#home").removeClass("stageLeft");
                $("#menu .viewport .menu.home").removeClass("stageLeft");
            });
            menu.append(span);

            span = $("<span>");
            span.addClass("button");
            span.addClass("blank");
            span.html("&nbsp;");
            menu.append(span);

            span = $("<span>");
            span.addClass("button");
            span.addClass("save");
            span.html("Save");
            span.click(function() {
                $("#add form").submit();
            });
            menu.append(span);

        })(top);

        $("#sync").hide();
        $("#sync").html("Sync&hellip;");
        $("#home").show();
    };

    App.prototype.padRight = function(s, size) {
        if (s.length >= size) {
            return s;
        }
        var mask = [];
        for (var i = 1; i <= size; i++) {
            mask.push(i % 10);
        }
        return s + mask.slice(s.length).join("");
    };

    App.prototype.pull = function() {
    };

    App.prototype.push = function() {
        $("#sync").show();

        var v = app.encrypt(
            JSON.stringify(app.data),
            app.passphrase
        );
        $.post(
            "/vault/push",
            {
                "_": new Date().getTime(),
                "data": v
            },
            function(data) {
                try {
                    data = app.decrypt($.trim(data), app.passphrase);
                    data = $.parseJSON(data);
                } catch (err) {
                }

                app.data = data;
                app.setList();
                
                if (app.trigger == "edit") {

                    var k = $("#edit").attr("data-key");

                    app.setView(k);

                    $("#view")[0].scrollTop = 0;

                    $("#edit").addClass("stageRight");
                    $("#menu .viewport .menu.edit").addClass("stageRight");
                    $("#view").removeClass("stageLeft");
                    $("#menu .viewport .menu.view").removeClass("stageLeft");
                    $("#sync").hide();

                } else if (app.trigger == "add") {

                    $("#add").addClass("stageRight");
                    $("#menu .viewport .menu.add").addClass("stageRight");
                    $("#home").removeClass("stageLeft");
                    $("#menu .viewport .menu.home").removeClass("stageLeft");
                    $("#sync").hide();

                } else if (app.trigger == "delete") {

                    $("#view").addClass("stageRight");
                    $("#menu .viewport .menu.view").addClass("stageRight");
                    $("#home").removeClass("stageLeft");
                    $("#menu .viewport .menu.home").removeClass("stageLeft");
                    $("#sync").hide();

                }

            },
            "text"
        );
    };

    App.prototype.setAdd = function(t) {
        $("#add_typename").val(t);

        var fieldset = $("#add_fieldset").empty();
        
        if (t == "web") {

            var p = $("<p>");
            p.addClass("label");
            fieldset.append(p);

            var label = $("<label>");
            label.attr("for", "add_name");
            label.html("Name");
            p.append(label);

            p = $("<p>");
            p.addClass("value");
            fieldset.append(p);

            var input = $("<input>");
            input.attr("type", "text");
            input.attr("autocorrect", "off");
            input.attr("id", "add_name");
            p.append(input);

            p = $("<p>");
            p.addClass("label");
            fieldset.append(p);

            var label = $("<label>");
            label.attr("for", "add_url");
            label.html("URL");
            p.append(label);

            p = $("<p>");
            p.addClass("value");
            fieldset.append(p);

            var input = $("<input>");
            input.attr("type", "text");
            input.attr("autocapitalize", "off");
            input.attr("autocorrect", "off");
            input.attr("id", "add_url");
            p.append(input);

            p = $("<p>");
            p.addClass("label");
            fieldset.append(p);

            var label = $("<label>");
            label.attr("for", "add_username");
            label.html("Username");
            p.append(label);

            p = $("<p>");
            p.addClass("value");
            fieldset.append(p);

            var input = $("<input>");
            input.attr("type", "text");
            input.attr("autocapitalize", "off");
            input.attr("autocorrect", "off");
            input.attr("id", "add_username");
            p.append(input);

            p = $("<p>");
            p.addClass("label");
            fieldset.append(p);

            var label = $("<label>");
            label.attr("for", "add_password");
            label.html("Password");
            p.append(label);

            p = $("<p>");
            p.addClass("value");
            fieldset.append(p);

            var input = $("<input>");
            input.attr("type", "text");
            input.attr("autocapitalize", "off");
            input.attr("autocorrect", "off");
            input.attr("id", "add_password");
            p.append(input);

            p = $("<p>");
            p.addClass("label");
            fieldset.append(p);

            var label = $("<label>");
            label.attr("for", "add_note");
            label.html("Note");
            p.append(label);

            p = $("<p>");
            p.addClass("value");
            fieldset.append(p);

            input = $("<textarea>");
            input.attr("id", "add_note");
            input.attr("rows", "12");
            p.append(input);

        } else if (t == "note") {

            var p = $("<p>");
            p.addClass("label");
            fieldset.append(p);

            var label = $("<label>");
            label.attr("for", "add_name");
            label.html("Name");
            p.append(label);

            p = $("<p>");
            p.addClass("value");
            fieldset.append(p);

            var input = $("<input>");
            input.attr("type", "text");
            input.attr("autocorrect", "off");
            input.attr("id", "add_name");
            p.append(input);

            p = $("<p>");
            p.addClass("label");
            fieldset.append(p);

            var label = $("<label>");
            label.attr("for", "add_note");
            label.html("Note");
            p.append(label);

            p = $("<p>");
            p.addClass("value");
            fieldset.append(p);

            input = $("<textarea>");
            input.attr("id", "add_note");
            input.attr("rows", "16");
            p.append(input);

        }
    }

    App.prototype.setList = function(k) {
        var ul = $("#home ul").empty();

        var keys = [];
        var map = {};
        for (k in app.data) {
            var _k = k.toLowerCase();
            map[_k] = k
            keys.push(_k);
        }
        keys.sort();

        for (var i = 0; i < keys.length; i++) {
            var k = map[keys[i]];
            var d = app.data[k];

            var e = $("<li>");
            e.attr("data-key", k);
            ul.append(e);

            e.append($("<strong>").html(d["name"]));
            e.append($("<span>").html(d["typetext"]));
            e.click(function() {
                var e = $(this);
                var k = e.attr("data-key");

                app.setView(k);

                $("#view")[0].scrollTop = 0;

                $("#home").addClass("stageLeft");
                $("#menu .viewport .menu.home").addClass("stageLeft");

                $("#view").removeClass("stageRight");
                $("#menu .viewport .menu.view").removeClass("stageRight");
            });
        }
    };

    App.prototype.setView = function(k) {
        $("#view").attr("data-key", k);
        var content = $("#view .content").empty();
        (function(content, k) {
            var d = app.data[k];

            var e = $("<div>");
            e.addClass("label");
            e.html("Name");
            content.append(e);

            e = $("<div>");
            e.addClass("value");
            e.html(d["name"]);
            content.append(e);

            if (d["typename"] == "web") {

                var e = $("<div>");
                e.addClass("label");
                e.html("URL");
                content.append(e);

                e = $("<div>");
                e.addClass("value");
                content.append(e);

                var a = $("<a>");
                a.attr("id", "view_url");
                a.attr("href", d["url"]);
                a.attr("target", "_blank");
                a.html(app.urlShorten(d["url"], 26));
                e.append(a);

                e = $("<div>");
                e.addClass("label");
                e.html("Username");
                content.append(e);

                e = $("<div>");
                e.addClass("value");
                e.attr("id", "view_username");
                e.html(d["username"]);
                content.append(e);


                e = $("<div>");
                e.addClass("label");
                e.html("Password");
                content.append(e);

                e = $("<div>");
                e.addClass("value");
                e.attr("id", "view_password");
                e.html(d["password"]);
                content.append(e);

                e = $("<div>");
                e.addClass("label");
                e.html("Note");
                content.append(e);

                e = $("<div>");
                e.addClass("value");
                e.addClass("note");
                e.attr("id", "view_note");
                if (d["note"] != "") {
                    e.html(d["note"]);
                } else {
                    e.html("&nbsp;");
                }
                content.append(e);

                e = $("<div>");
                e.addClass("label");
                e.html("Last Modified");
                content.append(e);

                e = $("<div>");
                e.addClass("value");
                e.attr("id", "view_modified");
                e.html(d["modified"]);
                content.append(e);

            } else if (d["typename"] == "note") {

                var e = $("<div>");
                e.addClass("label");
                e.html("Note");
                content.append(e);

                e = $("<div>");
                e.addClass("value");
                e.addClass("note");
                e.attr("id", "view_note");
                e.html(d["note"]);
                content.append(e);

                e = $("<div>");
                e.addClass("label");
                e.html("Last Modified");
                content.append(e);

                e = $("<div>");
                e.addClass("value");
                e.attr("id", "view_modified");
                e.html(d["modified"]);
                content.append(e);
            }

        })(content, k);
    };

    App.prototype.serializableIV = function() {
        var allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890"; 
        var iv = []
        while (iv.length < 16) {
            iv.push(allowed.charAt(Math.floor(Math.random() * allowed.length)));
        }
        return iv.join("");
    };

    App.prototype.toHex = function(s) {
        var h = [];
        for (var i = 0; i < s.length; i++) {
            h.push(s.charCodeAt(i).toString(16));
        }
        return h.join("");
    };

    App.prototype.trimTerminating = function(s) {
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c == 0 || c == 3) {
                return s.substring(0, i);
            }
        }
        return s;
    }

    App.prototype.unlock = function() {
        var panel = $("<div>");
        panel.attr("id", "unlock");

        var form = $("<form>");
        form.submit(function() {
            $("#sync").show();
            
            $.post(
                "/vault/pull",
                {
                    "_": new Date().getTime()
                },
                function(data) {
                    var password = $.trim($("#unlock input.password").val());
                    try {
                        data = app.decrypt($.trim(data), password);
                        data = $.parseJSON(data);
                    } catch (err) {
                        $("#unlock input.password").val("");
                        $("#unlock p.error").html("Invalid passphrase.").show();
                        $("#sync").hide();
                        return;
                    }
                    app.passphrase = password;
                    app.data = data;
                    $("#unlock").remove();
                    app.init();
                },
                "text"
            );

            return false;
        });
        panel.append(form);

        var p = $("<p>");
        p.addClass("error");
        form.append(p);

        p = $("<p>");
        form.append(p);

        var input = $("<input>");
        input.addClass("password");
        input.attr("type", "password");
        p.append(input)

        p = $("<p>");
        form.append(p);

        var button = $("<button>");
        button.addClass("submit");
        button.attr("type", "submit");
        button.html("Unlock");
        p.append(button);
        
        $("#chrome").append(panel);
    };

    App.prototype.urlShorten = function(s, i) {
        if (s.length > i) {
            return s.substring(0, i) + "&#133;";
        }
        return s;
    };

    window.app = new App();
})();

$(document).ready(function() {
    app.unlock();
});

