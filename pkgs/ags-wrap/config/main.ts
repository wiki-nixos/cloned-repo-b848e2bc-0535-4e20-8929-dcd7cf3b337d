const hyprland = await Service.import("hyprland")
import { notificationPopup } from './notificationsPop.js';
import { format } from 'date-fns'

const mpris = await Service.import('mpris')
const audio = await Service.import('audio')

// main scss file
const scss = `${App.configDir}/css/style.scss`

// target css file
const css = `/tmp/my-style.css`

// make sure sassc is installed on your system
Utils.exec(`sassc ${scss} ${css}`)

Utils.monitorFile(
  // directory that contains the scss files
  `${App.configDir}/css`,

  // reload function
  function () {
    // main scss file
    const scss = `${App.configDir}/css/style.scss`

    // target css file
    const css = `/tmp/my-style.css`

    // compile, reset, apply
    Utils.exec(`sassc ${scss} ${css}`)
    App.resetCss()
    App.applyCss(css)
  },
)

const Launcher = Widget.Icon({
  class_name: "launcher",
  icon: 'assets/nixos.svg',
  size: 20,
})

const Workspaces = Widget.Box({
  class_name: "workspaces",
  children: Array.from({ length: 5 }, (_, i) => i + 1).map(i => Widget.Label({
    attribute: i,
    class_name: "workspace",
    vpack: "center",
    hpack: "center",
    label: `${i}`,
    setup: self => self.hook(hyprland, () => {
      self.toggleClassName("active", hyprland.active.workspace.id === i)
      self.toggleClassName("occupied", (hyprland.getWorkspace(i)?.windows || 0) > 0)
    })
  })),
});

const ClientTitle = Widget.Label({
  class_name: "client-title",
  tooltip_text: hyprland.active.client.bind("title"),
  label: hyprland.active.client.bind("title").as(title => {
    return title.length <= 40 ? title : title.substring(0, 40) + "..."
  })
})

const time = Variable('', {
  poll: [1000, function () {
    return format(new Date(), "MMM do, HH:mm");
  }],
});

const Time = Widget.EventBox({
  class_name: "date",
  hpack: "center",
  child: Widget.Label({
    label: time.bind()
  })
})

function Media() {
  const label = Utils.watch("", mpris, "player-changed", () => {
    if (mpris.players[0]) {
      const { track_artists, track_title } = mpris.players[0]
      return `${track_title} ` // return `${track_artists.join(', ')} ─ ${track_title}`
    } else {
      return 'Nothing is playing'
    }
  })

  const tooltip = Utils.watch("", mpris, "player-changed", () => {
    if (mpris.players[0]) {
      const { track_artists, track_title } = mpris.players[0]
      return `${track_title} ─ ${track_artists.join(', ')}` // return `${track_artists.join(', ')} ─ ${track_title}`
    } else {
      return 'Nothing is playing'
    }
  })

  const playicon = Utils.watch("", mpris, "changed", () => {
    if (mpris.players[0]) {
      const { play_back_status } = mpris.players[0]
      if (play_back_status == "Playing") {
        return ""
      }
    }
    return ""
  })

  const source = Utils.watch("", mpris, "player-changed", () => {
    if (mpris.players[0]) {
      const { identity } = mpris.players[0]
      switch (identity) {
        case 'Spotify':
          return ``
        case 'Kodi':
          return `󰌔`
        case 'Mozilla Firefox':
          return ``
      }
      return `󰎈`
    } else {
      return ''
    }
  })

  const revealer = Widget.Revealer({
    transitionDuration: 1000,
    transition: 'slide_right',
    child: Widget.Box({

      children: [
        Widget.EventBox({ // 
          class_name: "media-buttons",
          child: Widget.Label({
            label: ""
          })
        }),

        Widget.EventBox({ // 
          class_name: "media-buttons",
          child: Widget.Label({
            label: playicon
          })
        }),

        Widget.EventBox({ // 
          class_name: "media-buttons",
          child: Widget.Label({
            label: ""
          })
        })
      ]
    }),
  })

  const widget = Widget.EventBox({
    on_hover: (event) => {
      if ("" + label != "Nothing is playing") {
        revealer.reveal_child = true;
        Utils.timeout(3000, () => {
          revealer.reveal_child = false;
        })
      }
    },

    child: Widget.Box({
      hpack: "end",
      children: [
        Widget.Label({
          class_name: "media-icon",
          label: source
        }),
        Widget.Label({
          class_name: "media-name",
          tooltip_text: tooltip,
          label
        }),
        revealer]
    })
  })

  return widget
}

function Volume() {
  const icons = {
    101: 'overamplified',
    67: 'high',
    34: 'medium',
    1: 'low',
    0: 'muted',
  }

  function getIcon() {
    const icon: any = audio.speaker.is_muted ? 0 : [101, 67, 34, 1, 0].find(
      threshold => threshold <= audio.speaker.volume * 100)

    return `audio-volume-${icons[icon]}-symbolic`
  }

  const icon = Widget.Icon({
    icon: Utils.watch(getIcon(), audio.speaker, getIcon)
  })

  const slider = Widget.Slider({
    hexpand: true,
    draw_value: false,
    on_change: ({ value }) => audio.speaker.volume = value,
    setup: self => self.hook(audio.speaker, () => {
      self.value = audio.speaker.volume || 0
    }),
  })

  return Widget.Box({
    class_name: 'volume',
    css: 'min-width: 180px',
    children: [icon, slider],
  })
}

const Left = Widget.Box({
  children: [Launcher, Workspaces, ClientTitle]
})

const Center = Widget.Box({
  children: [Time, Media()]
})

const Right = Widget.Box({
  hpack: "end",
  children: [
    Volume(),
    Widget.Label({
      label: time.bind()
    })]
})

const Bar = (monitor: number) => Widget.Window({
  monitor,
  name: `bar${monitor}`,
  className: "bar",
  anchor: ['top', 'left', 'right'],
  exclusivity: 'exclusive',
  vexpand: false,
  child: Widget.CenterBox({
    spacing: 8,
    start_widget: Left,
    center_widget: Center,
    end_widget: Right,
  }),
});

App.config({
  style: css,
  windows: [Bar(0),
    notificationPopup],
});

export { };
