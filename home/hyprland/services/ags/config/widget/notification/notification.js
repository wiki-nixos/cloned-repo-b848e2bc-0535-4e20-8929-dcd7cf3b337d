import GLib from 'types/@girs/glib-2.0/glib-2.0';
import { Align } from 'types/@girs/gtk-3.0/gtk-3.0.cjs';

const notifications = await Service.import("notifications")
const hyprland = await Service.import("hyprland")

export const hasNotifications = Variable(false);
export const notification_count = Variable(0);
export const doNotDisturb = Variable(false);

export const list = Widget.Box({
    vertical: true,
})

export const notification_list = Widget.Box({
    vertical: true,
    // children: notifications.notifications.map(smallNotification),
});

export function countNotifications() {
    return notifications.notifications.length
}

export function clearNotifications() {
    notifications.notifications.forEach(function (value) {
        removeNotification(value)
    })
}

// @ts-ignore
export function removeNotification(not) {
    // const clockList = notification_list.children.find(n => n.attribute.id === not.id)
    // @ts-ignore
    const notificationList = list.children.find(n => n.attribute.id === not.id)

    notificationList?.destroy()

    // if (notificationList != null) {
    //     // @ts-ignore
    //     notificationList.transition = "slide_right"
    //     // @ts-ignore
    //     notificationList.transitionDuration = 1000
    //     // @ts-ignore
    //     notificationList.revealChild = false
    //     Utils.timeout(600, () => {
    //         notificationList.destroy()
    //     })
    // }

    // Utils.timeout(600, () => {
    //     notifications.clear()
    // })

    // notification_list.children.find(n)?.destroy()
}

/** @param {import('resource:///com/github/Aylur/ags/service/notifications.js').Notification} n */
function NotificationIcon({ app_entry, app_icon, image }) {
    if (image) {
        return Widget.Box({
            css: `background-image: url("${image}");`
                + "background-size: cover;"
                + "background-repeat: no-repeat;"
                + "background-position: center;",
        })
    }

    let icon = "dialog-information-symbolic"
    if (Utils.lookUpIcon(app_icon))
        icon = app_icon

    if (app_entry && Utils.lookUpIcon(app_entry))
        icon = app_entry

    return Widget.Box({
        child: Widget.Icon({
            icon: icon,
            size: 48
        })
    })
}

/** @param {import('resource:///com/github/Aylur/ags/service/notifications.js').Notification} n */
function Notification(n) {
    const icon = Widget.Box({
        vpack: "start",
        class_name: "icon",
        child: NotificationIcon(n),
    })

    const title = Widget.Label({
        class_name: "title",
        xalign: 0,
        justification: "left",
        hexpand: true,
        max_width_chars: 24,
        truncate: "end",
        wrap: true,
        label: n.summary,
        use_markup: true,
    })

    const body = Widget.Label({
        class_name: "body",
        hexpand: true,
        use_markup: true,
        xalign: 0,
        justification: "left",
        label: n.body,
        wrap: true,
    })

    const actions = Widget.Box({
        class_name: "actions",
        children: n.actions.map(({ id, label }) => Widget.Button({
            class_name: "action-button",
            on_clicked: () => {
                n.invoke(id)
                // n.dismiss()
            },
            hexpand: true,
            child: Widget.Label(label),
        })),
    })

    switch (n.app_name) {
        case "Spotify":
            return Widget.Revealer({
                revealChild: false,
                transitionDuration: 500,
                transition: 'slide_down',
                attribute: { id: n.id, hint: "spotify" },
                setup: (self) => {
                    Utils.timeout(500, () => {
                        self.reveal_child = true;
                    })
                },
                child: Widget.EventBox({
                    on_primary_click: n.dismiss,
                    child: Widget.Box(
                        {
                            class_name: `notification ${n.urgency}`,
                            vertical: true,
                        },
                        Widget.Box([
                            icon,
                            Widget.Box(
                                { vertical: true },
                                title,
                                body,
                            ),
                        ]),
                        actions,
                    )
                })
            })
        default:
            return Widget.Revealer({
                revealChild: false,
                transitionDuration: 500,
                transition: 'slide_down',
                attribute: { id: n.id, hint: n.hints['hint']?.get_string()[0] },
                setup: (self) => {
                    Utils.timeout(500, () => {
                        self.reveal_child = true;
                    })
                },
                child: Widget.EventBox({
                    on_primary_click: n.dismiss,
                    child: Widget.Box(
                        {
                            class_name: `notification ${n.urgency}`,
                            vertical: true,
                        },
                        Widget.Box([
                            icon,
                            Widget.Box(
                                { vertical: true },
                                title,
                                body,
                            ),
                        ]),
                        actions,
                    )
                })
            })
    }
}

/** @param {import('resource:///com/github/Aylur/ags/service/notifications.js').Notification} n */
export function smallNotification(n) {
    if (hasNotifications.value == false)
        hasNotifications.setValue(true)

    const icon = Widget.Box({
        vpack: "start",
        class_name: "small-icon",
        child: NotificationIcon(n),
    })

    const big_icon = Widget.Box({
        hpack: "start",
        class_name: "big-small-icon",
        child: NotificationIcon(n),
    })

    const title = Widget.Label({
        class_name: "small-title",
        xalign: 0,
        justification: "left",
        max_width_chars: 24,
        truncate: "end",
        wrap: true,
        label: n.summary,
        use_markup: true,
    })

    const time_string = Variable('', {
        poll: [1000, function () {
            const now = GLib.DateTime.new_now_local();
            const then = GLib.DateTime.new_from_unix_local(n.time);
            const hour_diff = Math.round(now.get_hour() - then.get_hour());
            const minutes_diff = Math.round(now.get_minute() - then.get_minute());

            const s1 = hour_diff > 0 ? hour_diff + " Hour(s)" : "";
            const s2 = minutes_diff > 0 ? minutes_diff + " Minute(s)" : "";
            const s3 = ((hour_diff > 0 || minutes_diff > 0) ? "  " : "") + s1 + s2 + ((hour_diff > 0 || minutes_diff > 0) ? " ago." : "");
            return s3;
        }],
    });

    const time = Widget.Label({
        class_name: "small-time",
        justification: "left",
        label: time_string.bind(),
    })

    const dismiss = Widget.EventBox({
        hpack: "end",
        hexpand: true,
        halign: Align.END,
        child: Widget.Label({
            label: " ",
            tooltip_text: "Dismiss Notification"
        }),

        "on-primary-click": () => {
            n.close();
        }
    })

    const body = Widget.Label({
        class_name: "small-body",
        hexpand: true,
        use_markup: true,
        xalign: 0,
        justification: "left",
        label: n.body,
        wrap: true,
    })

    const actions = Widget.Box({
        class_name: "small-actions",
        children: n.actions.map(({ id, label }) => Widget.Button({
            class_name: "small-action-button",
            on_clicked: () => {
                n.invoke(id)
                // n.dismiss()
            },
            hexpand: false,
            child: Widget.Label(label),
        })),
    })

    switch (n.app_name) {
        case "Spotify":
            return Widget.Revealer({
                revealChild: false,
                transitionDuration: 500,
                transition: 'slide_down',
                attribute: { id: n.id, hint: "spotify" },
                setup: (self) => {
                    Utils.timeout(500, () => {
                        self.reveal_child = true;
                    })
                },
                child: Widget.Box({
                    class_name: `small-notification ${n.urgency}`,
                    children: [
                        icon,
                        Widget.Box({
                            vertical: true,
                            spacing: 5,
                            children: [
                                Widget.Box({
                                    spacing: 10,
                                    children: [title, time, dismiss]
                                }),
                                body,
                                actions
                            ],
                        })
                    ],
                })
            })
            break;
        case "wallpaper":
        case "screenshot":
            return Widget.Revealer({
                revealChild: false,
                transitionDuration: 500,
                transition: 'slide_down',
                attribute: { id: n.id, hint: n.hints['hint']?.get_string()[0] },
                setup: (self) => {
                    Utils.timeout(500, () => {
                        self.reveal_child = true;
                    })
                },
                child: Widget.Box({
                    class_name: `small-notification ${n.urgency}`,
                    vertical: true,
                    spacing: 14,
                    children: [
                        Widget.Box({
                            vertical: true,
                            children: [
                                Widget.Box({
                                    spacing: 5,
                                    children: [title, time, dismiss]
                                }),
                                body
                            ],
                        }),
                        big_icon,
                        Widget.Box({
                            class_name: "small-actions",
                            children: [
                                Widget.Button({
                                    class_name: "small-action-button",
                                    on_clicked: () => {

                                        //
                                    },
                                    hexpand: false,
                                    child: Widget.Label("Copy to Clipboard"),
                                })],
                        })
                    ]
                })
            })
            break;
        case "discord":
            return Widget.Revealer({
                revealChild: false,
                transitionDuration: 500,
                transition: 'slide_down',
                attribute: { id: n.id },
                setup: (self) => {
                    Utils.timeout(500, () => {
                        self.reveal_child = true;
                    })
                },
                child: Widget.Box({
                    attribute: { id: n.id },
                    class_name: `small-notification ${n.urgency}`,
                    children: [
                        icon,
                        Widget.Box({
                            vertical: true,
                            spacing: 5,
                            children: [
                                Widget.Box({
                                    spacing: 10,
                                    children: [title, time, dismiss]
                                }),
                                body,
                                Widget.Box({
                                    class_name: "small-actions",
                                    children: [
                                        Widget.Button({
                                            class_name: "small-action-button",
                                            on_clicked: () => {
                                                hyprland.messageAsync(`dispatch workspace 3`)
                                                // switch to discord
                                            },
                                            hexpand: false,
                                            child: Widget.Label("View"),
                                        })],
                                })
                            ],
                        })
                    ],
                })
            })
            break;
        default:
            return Widget.Revealer({
                revealChild: false,
                transitionDuration: 500,
                transition: 'slide_down',
                attribute: { id: n.id, hint: n.hints['hint']?.get_string()[0] },
                setup: (self) => {
                    Utils.timeout(500, () => {
                        self.reveal_child = true;
                    })
                },
                child: Widget.Box({
                    attribute: { id: n.id },
                    class_name: `small-notification ${n.urgency}`,
                    children: [
                        icon,
                        Widget.Box({
                            vertical: true,
                            spacing: 5,
                            children: [
                                Widget.Box({
                                    spacing: 10,
                                    children: [title, time, dismiss]
                                }),
                                body,
                                actions
                            ],
                        })
                    ],
                })
            })
            break;
    }
}

export function NotificationPopups(monitor = 0) {
    notifications.popupTimeout = 10000;
    // notifications.forceTimeout = true;

    function onNotified(_, /** @type {number} */ id) {
        notification_count.setValue(notification_count.value + 1);

        const n = notifications.getNotification(id)
        if (n) {
            const hint = n.hints['hint']?.get_string()[0]

            if (hint && hint != "") {
                // @ts-ignore
                list.children.find(n => n.attribute.hint === hint)?.destroy()
                // @ts-ignore
                notification_list.children.find(n => n.attribute.hint === hint)?.destroy()
            }

            if (n.app_name == "Spotify") {
                log("Hint: " + hint + " App Name: " + n.app_name)
                // @ts-ignore
                list.children.find(n => n.attribute.hint == "spotify")?.destroy()
                // @ts-ignore
                notification_list.children.find(n => n.attribute.hint == "spotify")?.destroy()
            }

            list.children = [...list.children, Notification(n)]
            notification_list.children = [...notification_list.children, smallNotification(n)]
        }
    }

    function onDismissed(_, /** @type {number} */ id) {
        // @ts-ignore
        const child = list.children.find(n => n.attribute.id === id)

        if (child != null) {
            // @ts-ignore
            child.transition = "slide_right"
            // @ts-ignore
            child.transitionDuration = 1000
            // @ts-ignore
            child.revealChild = false
            Utils.timeout(1000, () => {
                child.destroy()
            })
        }
    }

    function onClosed(_, /** @type {number} */ id) {
        // @ts-ignore
        notification_list.children.find(n => n.attribute.id === id)?.destroy()

        // @ts-ignore
        list.children.find(n => n.attribute.id === id)?.destroy()
        if (notification_list.children[0] == null) {
            hasNotifications.setValue(false)
        }
    }

    // list.hook(notifications, onNotified, "notified")
    list.hook(notifications, onDismissed, "dismissed")

    notification_list.hook(notifications, onNotified, "notified")
    notification_list.hook(notifications, onClosed, "closed")

    return Widget.Window({
        monitor,
        name: `notifications${monitor}`,
        class_name: "notification-popups",
        layer: "overlay",
        anchor: ["top", "right"],
        child: Widget.Box({
            css: "min-width: 2px; min-height: 2px;",
            class_name: "notifications",
            vertical: true,
            child: list,
        }),
    })
}
