(ns one.core.cursor
  (:require [clojure.string :as string]
            [one.core :as core]
            [one.core.view :as view]))

(defrecord Cursor [x y saved])

(def default-cursor (Cursor. 0 0 0))

(defn saved-cursor [x y]
  (Cursor. x y x))

(defn set-saved [cursor x]
  (assoc cursor :x x :saved x))

(defn left [editor]
  (core/update-cursor editor
                      (fn [cursor]
                        (let [x (:x cursor)]
                          (if (> x 0)
                            (set-saved cursor (dec x))
                            (let [y' (dec (:y cursor))]
                              (if-let [length (core/count-line editor y')]
                                (saved-cursor length y')
                                cursor)))))))

(defn down [editor]
  (let [cursor (core/get-cursor editor)
        {:keys [x y saved]} cursor
        length (core/count-lines editor)]
    (if (< y (dec length))
      (let [y' (inc y)
            x' (min (max x saved) (core/count-line editor y'))]
        (-> editor
            (core/set-cursor (assoc cursor
                               :x x'
                               :y y'))
            view/down))
      (core/set-cursor editor (set-saved cursor (core/count-line editor y))))))
                        

(defn up [editor]
  (let [cursor (core/get-cursor editor)
        {:keys [x y saved]} cursor]
    (if (> y 0)
      (let [y' (dec y)
            x' (min (max x saved) (core/count-line editor y'))]
        (-> editor
            (core/set-cursor (assoc cursor :x x' :y y'))
            view/up))
      (core/set-cursor editor (set-saved cursor 0)))))

(defn right [editor]
  (core/update-cursor editor
                      (fn [cursor]
                        (let [{:keys [x y]} cursor]
                          (if (< x (core/count-line editor y))
                            (set-saved cursor (inc x))
                            (let [y' (inc y)]
                              (if (< y' (core/count-lines editor))
                                (saved-cursor 0 y')
                                cursor)))))))

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
  (core/update-cursor editor #(set-saved % 0)))

(defn end-line [editor]
  (core/update-cursor editor #(set-saved % (core/count-line editor (:y %)))))

(defn start-buffer [editor]
  (-> editor
      (move-while (constantly true) up)
      start-line))

(defn end-buffer [editor]
  (-> editor
      (move-while (constantly true) down)
      end-line))
