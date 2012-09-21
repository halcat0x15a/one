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
            [onedit.util :as util]
            [onedit.cursor :as cursor]
            [onedit.command :as command]
            [onedit.style :as style]
            [onedit.parser :as parser]
            [onedit.syntax :as syntax]))

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
    (set! (.-fillStyle g) style/text-color)
    (set! (.-font g) (str style/font-size "px " style/font-family))
    (.clearRect g 0 0 width height)
    (dotimes [n (count strings)]
      (.fillText g (strings n) 0 (* (inc n) style/font-size)))
    (.fillText g style/pointer (text-width (subs (strings y) 0 x) g) (* (inc y) style/font-size))
    (doseq [[k c] (:table (parser/parse syntax/clojure string))]
      (doseq [[a b] c]
        (set! (.-fillStyle g) (k style/highlight))
        (let [substrings (string/split-lines (subs string 0 a))]
          (.fillText g (subs string a b) (text-width (last substrings) g) (* (count substrings) style/font-size)))))))

(defn update [this]
  (let [buffer (buffer-element)
        canvas (canvas-element)
        width (.-width (gstyle/getSize buffer))
        height (* (inc (core/count-lines this)) style/font-size)]
    (dom/log (core/get-cursor this))
    (dom/log (core/get-strings this))
    (gstyle/setStyle buffer style/buffer-style)
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
            (dom/log (.fromCharCode js/String (.-charCode event)))
            (if-let [mode (:mode @core/current-editor)]
              (when-let [f (mode (keyword (.fromCharCode js/String (.-charCode event))))]
                (.preventDefault event)
                (-> @core/current-editor
                    f
                    update))
              (when-let [move (case (.-keyCode event)
                                goog.events.KeyCodes/LEFT cursor/left
                                goog.events.KeyCodes/DOWN cursor/down
                                goog.events.KeyCodes/UP cursor/up
                                goog.events.KeyCodes/RIGHT cursor/right
                                nil)]
                (-> @core/current-editor
                    move
                    update))))
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
