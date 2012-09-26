(ns one.system
  (:require [clojure.string :as string]
            [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [goog.dom.selection :as gselection]
            [goog.events.KeyHandler :as gkey-handler]
            [goog.events.InputHandler :as ginput-handler]
            [goog.events.EventType :as gevents-type]
            [goog.style :as gstyle]
            [goog.editor.focus :as gfocus]
            [one.core :as core]
            [one.util :as util]
            [one.cursor :as cursor]
            [one.command :as command]
            [one.style :as style]
            [one.parser :as parser]
            [one.syntax :as syntax]))

(defn buffer-element []
  (dom/ensure-element :buffer))

(defn minibuffer-element []
  (dom/ensure-element :minibuffer))

(defn canvas-element []
  (dom/ensure-element :display))

(defn get-cursor [value element]
  (let [values (string/split-lines (subs value 0 (gselection/getEnd element)))]
    (core/saved-cursor (count (last values)) (dec (count values)))))

(def get-strings (comp vec string/split-lines))

(defn get-buffer []
  (let [element (buffer-element)
        value (dom/get-value element)]
    (core/->Buffer (get-strings value) (get-cursor value element))))

(defn text-width [s g]
  (-> g (.measureText s) .-width))

(defn render [editor canvas width height]
  (let [g (.getContext canvas "2d")
        {:keys [x y]} (core/get-cursor editor)
        strings (core/get-strings editor)
        string (util/join-newline strings)]
    (set! (.-font g) (str style/font-size "px " style/font-family))
    (.clearRect g 0 0 width height)
    (loop [tokens (parser/parse syntax/clojure string) s "" y 0]
      (if (empty? tokens)
        nil
        (let [{:keys [type text]} (first tokens)
              nexts (rest tokens)]
          (if (re-matches syntax/re-newline text)
            (recur nexts "" (inc y))
            (do
              (set! (.-fillStyle g) (if (nil? type) style/text-color (type style/highlight)))
              (.fillText g text (text-width s g) (* (inc y) style/font-size))
              (recur nexts (str s text) y))))))
    (set! (.-fillStyle g) style/text-color)
    (.fillText g style/pointer (text-width (subs (strings y) 0 x) g) (* (inc y) style/font-size))))

(defn update [this]
  (let [buffer (buffer-element)
        canvas (canvas-element)
        width (.-width (gstyle/getSize buffer))
        height (* (inc (core/count-lines this)) style/font-size)]
    (gstyle/setStyle buffer style/buffer-style)
    (gselection/setCursorPosition buffer (core/cursor-position this))
    (dom/set-value buffer (core/get-string this))
    (dom/set-properties canvas {"width" width "height" height})
    (render this canvas width height)
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

(defn listen [handler type element f]
  (.addEventListener (handler element) type f))

(def listen-key
  (partial listen #(goog.events/KeyHandler. %) (.-KEY gkey-handler/EventType)))

(def listen-input
  (partial listen #(goog.events/InputHandler. %) (.-INPUT ginput-handler/EventType)))

(defn code->key [event]
  (case (.-keyCode event)
    goog.events.KeyCodes/ESC :esc
    goog.events.KeyCodes/LEFT :left
    goog.events.KeyCodes/DOWN :down
    goog.events.KeyCodes/UP :up
    goog.events.KeyCodes/RIGHT :right
    (keyword (.fromCharCode js/String (.-charCode event)))))

(defn buffer-key [event]
  (if-let [keymap (:function (:mode @core/current-editor))]
    (let [key (case (.-keyCode event)
                goog.events.KeyCodes/ESC :esc
                (keyword (.fromCharCode js/String (.-charCode event))))]
      (when-let [f (keymap key)]
        (.preventDefault event)
        (-> @core/current-editor
            f
            update)))
    (when-let [move (case (.-keyCode event)
                      goog.events.KeyCodes/LEFT cursor/left
                      goog.events.KeyCodes/DOWN cursor/down
                      goog.events.KeyCodes/UP cursor/up
                      goog.events.KeyCodes/RIGHT cursor/right
                      nil)]
      (-> @core/current-editor
          move
          update))))

(defn set-command [f]
  (let [this (f @core/current-editor)]
    (dom/set-value (minibuffer-element) (command/get-command this))
    (update this)))

(defn minibuffer-key [event]
  (case (.-keyCode event)
    goog.events.KeyCodes/UP (set-command command/set-prev-command)
    goog.events.KeyCodes/DOWN (set-command command/set-next-command)
    goog.events.KeyCodes/ENTER (exec)
    nil))

(defn buffer-input [event]
  (-> @core/current-editor
      (core/set-buffer (get-buffer))
      update))

(defn minibuffer-input [event]
  (-> @core/current-editor
      (command/set-current-command (dom/get-value (minibuffer-element)))
      update))

(defn init []
  (doto (buffer-element)
    (listen-key buffer-key)
    (listen-input buffer-input)
    (event/listen gevents-type/CLICK buffer-input))
  (doto (minibuffer-element)
    (listen-key minibuffer-key)
    (listen-input minibuffer-input)
    (gfocus/focusInputField))
  (update @core/current-editor))
