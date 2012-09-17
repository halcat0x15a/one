(ns onedit.system
  (:require [clojure.string :as string]
            [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [goog.dom.selection :as gselection]
            [goog.events.KeyHandler :as gkey-handler]
            [goog.events.InputHandler :as ginput-handler]
            [goog.events.EventType :as gevents-type]
            [goog.style :as gstyle]
            [goog.editor.focus :as gfocus]
            [onedit.core :as core]
            [onedit.cursor :as cursor]
            [onedit.command :as command]
            [onedit.graphics :as graphics]
            [onedit.style :as style]))

(defn buffer-element []
  (dom/ensure-element :buffer))

(defn minibuffer-element []
  (dom/ensure-element :minibuffer))

(defn canvas-element []
  (dom/ensure-element :display))

(defn get-cursor [value element]
  (let [values (string/split-lines (subs value 0 (gselection/getStart element)))]
    (core/saved-cursor (count (last values)) (dec (count values)))))

(def get-strings (comp vec string/split-lines))

(defn get-buffer []
  (let [element (buffer-element)
        value (dom/get-value element)]
    (core/->Buffer (get-strings value) (get-cursor value element))))

(defn update [this]
  (let [buffer (buffer-element)
        canvas (canvas-element)]
    (gstyle/setStyle buffer style/buffer-style)
    (dom/set-value buffer (core/get-string this))
    (dom/set-properties
     canvas
     {"width" (.-width (gstyle/getSize buffer))
      "height" (* (count (core/get-string this)) style/font-size)})
    (graphics/render this canvas)
    (reset! core/current-editor this)))

(defn exec []
  (let [minibuffer (minibuffer-element)
        value (dom/get-value minibuffer)]
    (when-let [[f & args] (core/parse-command @core/current-editor value)]
      (let [this (apply f @core/current-editor args)]
        (dom/set-value minibuffer "")
        (-> this
            (command/add-history value)
            command/reset-history
            update)))))

(defn init []
  (letfn [(listen-key-event [element handler]
            (-> element
                (goog.events/KeyHandler.)
                (.addEventListener (.-KEY gkey-handler/EventType) handler)))
          (listen-input-event [element handler]
            (-> element
                (goog.events/InputHandler.)
                (.addEventListener (.-INPUT ginput-handler/EventType) handler)))
          (buffer-key-handler [event]
            (let [move (case (.-keyCode event)
                         goog.events.KeyCodes/LEFT cursor/left
                         goog.events.KeyCodes/DOWN cursor/down
                         goog.events.KeyCodes/UP cursor/up
                         goog.events.KeyCodes/RIGHT cursor/right
                         identity)]
              (-> @core/current-editor
                  move
                  update)))
          (set-command [f]
            (let [this (f @core/current-editor)]
              (dom/set-value (minibuffer-element) (command/get-command this))
              (update this)))
          (minibuffer-key-handler [event]
            (case (.-keyCode event)
              goog.events.KeyCodes/UP (set-command command/set-prev-command)
              goog.events.KeyCodes/DOWN (set-command command/set-next-command)
              goog.events.KeyCodes/ENTER (exec)
              nil))
          (buffer-input-handler [event]
            (-> @core/current-editor
                (core/set-buffer (get-buffer))
                update))
          (minibuffer-input-handler [event]
            (-> @core/current-editor
                (command/set-current-command (dom/get-value (minibuffer-element)))
                update))]
    (doto (buffer-element)
      (listen-key-event buffer-key-handler)
      (listen-input-event buffer-input-handler)
      (event/listen gevents-type/CLICK buffer-input-handler))
    (doto (minibuffer-element)
      (listen-key-event minibuffer-key-handler)
      (listen-input-event minibuffer-input-handler)
      (gfocus/focusInputField))
    (update @core/current-editor)))
