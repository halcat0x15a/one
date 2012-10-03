(ns one.core.cursor
  (:require [clojure.string :as string]
            [one.core.view :as view]
            [one.core.lens :as lens]))

(defrecord Cursor [x y saved])

(def default-cursor (Cursor. 0 0 0))

(defn saved-cursor [x y]
  (Cursor. x y x))

(defn set-saved [x cursor]
  (assoc cursor :x x :saved x))

(defn left [editor]
  (letfn [(left' [cursor]
            (let [x (:x cursor)]
              (if (> x 0)
                (set-saved (dec x) cursor)
                (let [y' (dec (:y cursor))]
                  (if-let [length (lens/count-line y' editor)]
                    (saved-cursor length y')
                    cursor)))))]
    (lens/modify lens/cursor left' editor)))

(defn down [editor]
  (let [cursor (lens/lens-get lens/cursor editor)
        {:keys [x y saved]} cursor
        length (lens/count-lines editor)]
    (if (< y (dec length))
      (let [y' (inc y)
            x' (min (max x saved) (lens/count-line y' editor))]
        (->> editor
             (lens/lens-set lens/cursor (assoc cursor :x x' :y y'))
             view/down))
      (lens/lens-set lens/cursor (saved-cursor (lens/count-line y editor) y) editor))))

(defn up [editor]
  (let [cursor (lens/lens-get lens/cursor editor)
        {:keys [x y saved]} cursor]
    (if (> y 0)
      (let [y' (dec y)
            x' (min (max x saved) (lens/count-line y' editor))]
        (->> editor
            (lens/lens-set lens/cursor (assoc cursor :x x' :y y'))
            view/up))
      (lens/lens-set lens/cursor (saved-cursor 0 y) editor))))

(defn right [editor]
  (letfn [(right' [cursor]
            (let [{:keys [x y]} cursor]
              (if (< x (lens/count-line y editor))
                (set-saved (inc x) cursor)
                (let [y' (inc y)]
                  (if (< y' (lens/count-lines editor))
                    (saved-cursor 0 y')
                    cursor)))))]
    (lens/modify lens/cursor right' editor)))

(defn move-while [editor pred f]
  (loop [editor editor]
    (let [{:keys [x y]} (lens/lens-get lens/cursor editor)
          editor' (f editor)]
      (if-let [character (str (get (lens/lens-get (lens/line y) editor) x))]
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
  (lens/modify lens/cursor (partial set-saved 0) editor))

(defn end-line [editor]
  (lens/modify lens/cursor #(set-saved (lens/count-line (:y %) editor) %) editor))

(defn start-buffer [editor]
  (-> editor
      (move-while (constantly true) up)
      start-line))

(defn end-buffer [editor]
  (-> editor
      (move-while (constantly true) down)
      end-line))
