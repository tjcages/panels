export const VIEWPORT = { width: 1440, height: 810 }
export const DSF = 3

const slider = (label) => `[role=slider][aria-label="${label}"]`

// Drag a slider from its current value to `to` (fraction of the track).
async function drag({ move, down, up, wait, box }, label, to, ms = 850) {
  const track = await box(slider(label))
  const fill = await box(`${slider(label)} .panel-slider-fill`).catch(() => null)
  const fromX = fill ? fill.x + fill.width : track.x + track.width * 0.3
  await move(fromX, track.cy, 650, "arrive")
  await wait(220)
  await down()
  await move(track.x + track.width * to, track.cy, ms)
  await wait(120)
  await up()
}

export const SHOTS = {
  // Waves alone, then ⌘⌥D brings the panel in with its own entrance.
  // (Mounting collapsed opens the float panel top-left — a product bug — so
  // the shot closes the docked panel first and then reopens it.)
  reveal: {
    run: async ({ wait, press }) => {
      await wait(200)
      await press("Control+Alt+KeyD")
      await wait(1400)
      await press("Control+Alt+KeyD")
      await wait(2200)
    },
  },
  // Amplitude swells the waves, Lines packs them denser.
  sliders: {
    from: "reveal",
    run: async (api) => {
      await api.wait(300)
      await drag(api, "Amplitude", 0.84)
      await api.wait(700)
      await drag(api, "Lines", 0.9, 900)
      await api.wait(900)
    },
  },
  // Tint swatch → library popover → pick a pink; the field recolors.
  color: {
    from: "sliders",
    run: async (api) => {
      const { move, down, up, wait, box } = api
      await wait(300)
      const sw = await box('button[aria-label="Tint color"]')
      await move(sw.cx, sw.cy, 700, "arrive")
      await wait(200)
      await down(); await up()
      await wait(700)
      const pink = await box('.panel-color-pop-item:has-text("F72585")')
      await move(pink.cx, pink.cy, 650)
      await wait(250)
      await down(); await up()
      await wait(1400)
    },
  },
  // Light → Dark backdrop.
  backdrop: {
    from: "color",
    run: async ({ move, down, up, wait, box }) => {
      await wait(300)
      const dark = await box('.panel-toggle-group-btn:has-text("Dark")')
      await move(dark.cx, dark.cy, 700, "arrive")
      await wait(250)
      await down(); await up()
      await wait(1600)
    },
  },
  // Add a ribbon: a second band of lines joins the field.
  collection: {
    from: "backdrop",
    run: async ({ move, down, up, wait, box }) => {
      await wait(300)
      const add = await box(".panel-collection-add")
      await move(add.cx, add.cy, 700, "arrive")
      await wait(250)
      await down(); await up()
      await wait(1800)
    },
  },
  // Grab the header and throw the panel to the left edge.
  float: {
    from: "collection",
    run: async (api) => {
      const { move, down, up, wait, box, kind } = api
      await wait(300)
      const head = await box(".panel-panel-header")
      const gx = head.x + head.width * 0.45
      await move(gx, head.cy, 700, "arrive")
      kind("grab")
      await wait(250)
      await down()
      kind("grabbing")
      await move(gx - 120, head.cy + 12, 240, "linear")
      await move(gx - 640, head.cy + 40, 190, "throw")
      await up()
      kind("grab")
      await wait(1800)
    },
  },
}
