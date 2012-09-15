(ns onedit.cursor
  (:require [clojure.string :as string]
            [onedit.core :as core]))

(defn left [editor]
  (let [cursor (core/get-cursor editor)
        {:keys [x y]} cursor]
    (if (> x 0)
      (let [x' (dec x)]
        (core/set-cursor editor (core/set-saved cursor x')))
      (let [y' (dec y)]
        (if-let [length (core/count-line editor y')]
          (core/set-cursor editor (core/saved-cursor length y'))
          editor)))))

(defn down [editor]
  (let [cursor (core/get-cursor editor)
        {:keys [x y]} cursor]
    (core/set-cursor
     editor
     (if (< y (dec (core/count-lines editor)))
       (let [y' (inc y)]
         (assoc cursor
           :x (min (max x (:saved cursor)) (core/count-line editor y'))
           :y y'))
       (core/set-saved cursor (core/count-line editor y))))))

(defn up [editor]
  (let [cursor (core/get-cursor editor)
        {:keys [x y]} cursor]
    (core/set-cursor
     editor
     (if (> y 0)
       (let [y' (dec y)]
         (assoc cursor
           :x (min (max x (:saved cursor)) (core/count-line editor y'))
           :y y'))
       (core/set-saved cursor 0)))))

(defn right [editor]
  (let [cursor (core/get-cursor editor)
        {:keys [x y]} cursor]
    (if (< x (core/count-line editor (:y cursor)))
      (let [x' (inc x)]
        (core/set-cursor editor (core/set-saved cursor x')))
      (let [y' (inc y)]
        (if (< y' (core/count-lines editor))
          (core/set-cursor editor (core/saved-cursor 0 y'))
          editor)))))

(defn move-while [editor pred f]
  (loop [editor editor]
    (let [{:keys [x y]} (core/get-cursor editor)
          editor' (f editor)]
      (if-let [character (str (get (core/get-line editor y) x))]
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
  (core/set-cursor editor (core/set-saved (core/get-cursor editor) 0)))

(defn end-line [editor]
  (let [cursor (core/get-cursor editor)
        length (core/count-line editor (:y cursor))]
    (core/set-cursor editor
      (assoc cursor :x length :saved length))))

(defn start-buffer [editor]
  (-> editor
      (move-while (constantly true) up)
      start-line))

(defn end-buffer [editor]
  (-> editor
      (move-while (constantly true) down)
      end-line))
