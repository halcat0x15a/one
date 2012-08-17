(ns onedit.cursor
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [onedit.core :as core]
            [onedit.buffer :as buffer]))

(defrecord Cursor [x y])

(def unit (Cursor. 0 0))

(defn create
  ([] (Cursor. (create "left") (create "top")))
  ([attr]
     (let [str (aget (aget (dom/ensure-element :cursor) "style") attr)]
       (int (subs str 0 (- (count str) 2))))))

(defn update
  ([cursor] (update (:x cursor) (:y cursor)))
  ([x y]
     (dom/set-properties :cursor {"style" (str "left: " x "ex; top: " y "em;")})))

(defn left [editor]
  (let [cursor (:cursor editor)
        x (:x cursor)]
    (if (> x 0)
      (assoc editor
        :cursor (assoc cursor
                  :x (dec x)))
      editor)))

(defn down [editor]
  (let [cursor (:cursor editor)
        x (:x cursor)
        y (:y cursor)
        y' (inc y)
        length (buffer/count-line editor y')]
    (if (< y (dec (buffer/count-lines editor)))
      (assoc editor
        :cursor (assoc cursor
                  :x (if (< x length)
                       x
                       length)
                  :y y'))
      editor)))

(defn up [editor]
  (let [cursor (:cursor editor)
        x (:x cursor)
        y (:y cursor)
        y' (dec y)
        length (buffer/count-line editor y')]
    (if (> y 0)
      (assoc editor
        :cursor (assoc cursor
                  :x (if (< x length)
                       x
                       length)
                  :y y'))
      editor)))

(defn right [editor]
  (let [cursor (:cursor editor)
        x (:x cursor)]
    (if (< x (buffer/count-line editor (:y cursor)))
      (assoc editor
        :cursor (assoc cursor
                  :x (inc x)))
      editor)))

(defn move-while [editor pred f]
  (loop [editor editor]
    (let [cursor (:cursor editor)
          editor' (f editor)]
      (if-let [character (nth (get (:buffer editor) (:y cursor)) (:x cursor))]
        (if (and (not= editor' editor) (pred character))
          (recur editor')
          editor)
        editor))))

(defn forward [editor]
  (-> editor
      (move-while string/blank? right)
      (move-while (comp not string/blank?) right)))

(defn backward [editor]
  (-> editor
      left
      (move-while string/blank? left)
      (move-while (comp not string/blank?) left)
      (move-while string/blank? right)))

(defn start-line [editor]
  (-> editor
      left
      (move-while (constantly true) left)))

(defn end-line [editor]
  (move-while editor (constantly true) right))

(core/register :h left)
(core/register :j down)
(core/register :k up)
(core/register :l right)
(core/register :w forward)
(core/register :b backward)
(core/register :| start-line)
(core/register :$ end-line)
