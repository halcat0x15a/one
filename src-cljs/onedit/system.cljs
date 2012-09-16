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
            [onedit.graphics :as graphics]
            [onedit.style :as style]))

(defn buffer-element []
  (dom/ensure-element :buffer))

(defn minibuffer-element []
  (dom/ensure-element :minibuffer))

(defn get-cursor [value element]
  (let [values (string/split-lines (subs value 0 (gselection/getStart element)))]
    (core/saved-cursor (count (last values)) (dec (count values)))))

(def get-strings (comp vec string/split-lines))

(defn get-buffer []
  (let [element (buffer-element)
        value (dom/get-value element)]
    (core/->Buffer (get-strings value) (get-cursor value element))))

(defn update [this]
  (let [buffer (buffer-element)]
    (gstyle/setStyle buffer style/buffer-style)
    (dom/set-value buffer (core/get-string this))
    (graphics/render this)
    (reset! core/current-editor this)))

(defrecord History [commands cursor])

(def history (atom (History. (list) 0)))

(defn exec []
  (let [minibuffer (minibuffer-element)
        value (dom/get-value minibuffer)]
    (when-let [[f & args] (core/parse-command @core/current-editor value)]
      (let [this (apply f @core/current-editor args)]
        (swap! history #(->History (cons value (:commands %)) 0))
        (dom/log history)
        (dom/set-value minibuffer "")
        (update this)))))

(defn set-history [pred f]
  (let [{:keys [commands cursor]} @history
        cursor' (f cursor)]
    (when (pred cursor commands)
      (dom/set-value (minibuffer-element) (nth commands (dec cursor') nil))
      (swap! history #(assoc % :cursor cursor')))))

(defn init []
  (letfn [(listen-key-event [element handler]
            (-> element
                (goog.events/KeyHandler.)
                (.addEventListener (.-KEY gkey-handler/EventType) handler)))
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
          (minibuffer-key-handler [event]
            (case (.-keyCode event)
              goog.events.KeyCodes/UP (set-history #(< %1 (count %2)) inc)
              goog.events.KeyCodes/DOWN (set-history #(> %1 0) dec)
              goog.events.KeyCodes/ENTER (exec)
              nil))
          (input-handler [event]
            (-> @core/current-editor
                (core/set-buffer (get-buffer))
                update))]
    (doto (buffer-element)
      (listen-key-event buffer-key-handler)
      (-> (goog.events/InputHandler.)
          (.addEventListener (.-INPUT ginput-handler/EventType) input-handler))
      (event/listen gevents-type/CLICK input-handler))
    (doto (minibuffer-element)
      (listen-key-event minibuffer-key-handler)
      (gfocus/focusInputField))
    (update @core/current-editor)))
