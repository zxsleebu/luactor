require("advanced math")
local col = require("colors")
local render = require("render")
local drag, __drag_elements = require("drag")()

--#region definitions
---@param key string
---@param default_pos vec2_t
---@return draggable_t
drag.new = function(key, default_pos)
    __drag_elements[key] = {
        pos = {
            x = ui.add_slider_float(key .. "__x", key .. "_dx", 0, 1, default_pos.x),
            y = ui.add_slider_float(key .. "__y", key .. "_dy", 0, 1, default_pos.y),
        },
        hovered = false,
        key = key,
        highlight_alpha = 0,
        old_cursor = renderer.get_cursor_pos() / engine.get_screen_size(),
        dragging = false,
    }
    __drag_elements[key].pos.x:set_visible(false) __drag_elements[key].pos.y:set_visible(false)
    return setmetatable(__drag_elements[key], drag.mt)
end
--#endregion
local v2, v3 = require("vectors")()


local draw_border = function(from, to, clr, r)
    render.circle(v2(from.x + r, from.y + r), r, clr:alpha(clr.a / 255 * 175), 275, 185, false)
    render.circle(v2(to.x - r - 1, from.y + r), r, clr:alpha(clr.a / 255 * 175), 355, 275, false)
    local faded_clr = clr:alpha(0)
    renderer.rect_filled(v2(from.x + r, from.y), v2(to.x - r, from.y + 1), clr)
    renderer.rect_filled_fade(v2(from.x, from.y + r), v2(from.x + 1, to.y - r + 1), clr, clr, faded_clr, faded_clr)
    renderer.rect_filled_fade(v2(to.x - 1, from.y + r), v2(to.x, to.y - r + 1), clr, clr, faded_clr, faded_clr)
end
local draw_shadow = function (from, to, clr, r)
    local spreading = 2
    local opacity = 20
    for i = 1, 8 do
        render.rounded_rect(
            v2(from.x - spreading * i, from.y - spreading * i),
            v2(to.x + spreading * i, to.y + spreading * i),
            clr:alpha((clr.a / 255) * opacity / i),
            math.min(math.ceil(r * i + 1), 20),
            true
        )
    end
end

local widget_font_size = 12
local widget_font = renderer.setup_font("C:/Windows/Fonts/verdana.ttf", widget_font_size, 128 + 16)

---@param from vec2_t
---@param to vec2_t
---@param clr color_t
local draw_container = function(from, to, clr, text)
    local r = 3
    local from_rounded, to_rounded = from:round(), to:round()
    draw_shadow(from_rounded, to_rounded, clr, r+1)
    render.rounded_rect(from_rounded, to_rounded, col(12, 12, 12, clr.a / 2), r+1, true)
    draw_border(from_rounded, to_rounded, clr, r)
    -- draw_border(v2(from.x + 1, from.y + 1), v2(to.x - 1, to.y - 1), clr, r - 1)
    local text_size = renderer.get_text_size(widget_font, widget_font_size, text)
    local text_pos = (from + ((to - from) / 2) - (text_size / 2)) ---@type vec2_t
    text_pos.y = math.round(text_pos.y)
    renderer.text(
        text,
        widget_font,
        v2(text_pos.x + 1, text_pos.y + 1),
        widget_font_size,
        col(0, 0, 0, clr.a / 2)
    )
    renderer.text(
        text,
        widget_font,
        text_pos,
        widget_font_size,
        col(255, 255, 255, clr.a)
    )
end

local ss = engine.get_screen_size()

local watermark_elements = {
    function()
        return "script"
    end,
    client.get_username,
    function()
        if not engine.is_connected() then return end
        return se.get_latency() .. "ms"
    end,
    function ()
        return os.date("%H:%M")
    end
}
local draw_watermark = function(color)
    local elements = {}
    for i = 1, #watermark_elements do
        local result = watermark_elements[i]()
        if result then
            elements[#elements+1] = result
        end
    end
    local text = table.concat(elements, " | ")
    local text_size = renderer.get_text_size(widget_font, widget_font_size, text)
    local margin = 7
    local to = v2(ss.x - 3, 3 + 20)
    draw_container(v2(to.x - text_size.x - margin * 2, 3), to, color, text)
end
key_bind_t.on = function(s)
    local m, a = s:get_type(), s:is_active()
    if m == 1 or m == 2 then return s:get_key() ~= 0 and a else return a end
end
key_bind_t.get_mode = function(s)
    return ({"on", "hold", "toggle", "off"})[s:get_type() + 1]
end
local keybind_elements
do
    local rage_active_exploit_bind = ui.get_key_bind("rage_active_exploit_bind")
    local rage_active_exploit = ui.get_combo_box("rage_active_exploit")
    local antihit_extra_fakeduck_bind = ui.get_key_bind("antihit_extra_fakeduck_bind")
    local antihit_extra_autopeek_bind = ui.get_key_bind("antihit_extra_autopeek_bind")
    local add = function(text, state)
        return {
            state = state,
            text = text,
            margin = 0,
            alpha = 0,
        }
    end
    local function info(el) return function() return el:on(), el:get_mode() end end
    keybind_elements = {
        add("Double tap", function ()
            return rage_active_exploit_bind:on() and rage_active_exploit:get_value() == 2, rage_active_exploit_bind:get_mode()
        end),
        add("On-shot Anti-Aim", function ()
            return rage_active_exploit_bind:on() and rage_active_exploit:get_value() == 1, rage_active_exploit_bind:get_mode()
        end),
        add("Quick peek", info(antihit_extra_autopeek_bind)),
        add("Duck peek assist", info(antihit_extra_fakeduck_bind)),
        add("Menu open", function ()
            return ui.is_visible(), "toggle"
        end)
    }
end

local min_keybind_width = 120
local keybinds_width = min_keybind_width
local keybinds_opacity = 0
local keybinds_drag = drag.new("keybinds", v2(0.5, 0.5))
local draw_keybinds = function(color)
    local max_text_size = min_keybind_width
    local size = v2(keybinds_width, 20)
    local keybinds_visible = false

    for i = 1, #keybind_elements do
        local bind = keybind_elements[i]
        local active, mode = bind.state()
        bind.margin = math.anim(bind.margin, active and 13 or 0)
        bind.alpha = math.anim(bind.alpha, active and 255 or 0)
        bind.mode = "[" .. tostring(mode) .. "]"


        if math.round(bind.alpha) > 0 then
            keybinds_visible = true
            local text_width = renderer.get_text_size(widget_font, widget_font_size, bind.text..bind.mode).x + 20 + 6
            if text_width > max_text_size then
                max_text_size = text_width
            end
        end
    end
    keybinds_width = math.anim(keybinds_width, max_text_size)
    keybinds_opacity = math.anim(keybinds_opacity, keybinds_visible and 255 or 0)
    size = v2(math.round(keybinds_width), size.y)
    local pos, highlight = keybinds_drag:run(drag.hover_fn(size, true), function (pos, alpha)
        drag.highlight(pos, size, alpha / 255 * math.round(keybinds_opacity))
    end)
    pos.x = pos.x - size.x / 2--math.round()

    local y = pos.y + size.y + 2
    for i = 1, #keybind_elements do
        local bind = keybind_elements[i]
        local margin, alpha = math.round(bind.margin), math.round(bind.alpha)
        local visible = alpha > 0
        if visible then
            local pos_round = v2(pos.x, y):round()
            renderer.text(bind.text, widget_font, v2(pos_round.x + 3 + 1, pos_round.y + 1), widget_font_size, col(0, 0, 0, alpha / 2))
            renderer.text(bind.text, widget_font, v2(pos_round.x + 3, pos_round.y), widget_font_size, col(255, 255, 255, alpha))

            local text_size = renderer.get_text_size(widget_font, widget_font_size, bind.mode)
            renderer.text(bind.mode, widget_font, v2(pos_round.x + size.x - text_size.x - 3 + 1, pos_round.y + 1), widget_font_size, col(0, 0, 0, alpha / 2))
            renderer.text(bind.mode, widget_font, v2(pos_round.x + size.x - text_size.x - 3, pos_round.y), widget_font_size, col(255, 255, 255, alpha))
            y = y + margin
        end
    end

    local opacity = math.round(keybinds_opacity)
    if opacity <= 0 then return end
    draw_container(pos, v2(pos.x + size.x, pos.y + size.y), col(color.r, color.g, color.b, opacity), "keybinds")
    highlight()
end
client.register_callback("paint", function ()
    local color = col(50, 150, 255, 255)
    -- local text = string.format("%s", client.get_username(), )
    -- local size = v2(140, 20)
    -- local pos = v2(750, 380)
    -- draw_container(pos, v2(pos.x + size.x, pos.y + size.y), )
    draw_watermark(color)
    draw_keybinds(color)
end)