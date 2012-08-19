(ns onedit.cursor
  (:require [clojure.string :as string]
            [onedit.core :as core])
  (:use-macros [onedit.core :only [fn-map]]))

(defn left [editor]
  (let [cursor (core/get-cursor editor)
        x (:x cursor)]
    (if (> x 0)
      (core/set-cursor editor (assoc cursor
                                :x (dec x)))
      editor)))

(defn down [editor]
  (let [cursor (core/get-cursor editor)
        x (:x cursor)
        y (:y cursor)
        y' (inc y)
        length (core/count-line editor y')]
    (if (< y (dec (core/count-lines editor)))
      (core/set-cursor editor (assoc cursor
                                :x (if (< x length)
                                     x
                                     length)
                                :y y'))
      editor)))

(defn up [editor]
  (let [cursor (core/get-cursor editor)
        x (:x cursor)
        y (:y cursor)
        y' (dec y)
        length (core/count-line editor y')]
    (if (> y 0)
      (core/set-cursor editor (assoc cursor
                                :x (if (< x length)
                                     x
                                     length)
                                :y y'))
      editor)))

(defn right [editor]
  (let [cursor (core/get-cursor editor)
        x (:x cursor)]
    (if (< x (core/count-line editor (:y cursor)))
      (core/set-cursor editor (assoc cursor
                                :x (inc x)))
      editor)))

(defn move-while [editor pred f]
  (loop [editor editor]
    (let [cursor (core/get-cursor editor)
          editor' (f editor)]
      (if-let [character (nth (core/get-line editor (:y cursor)) (:x cursor))]
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
  (core/set-cursor editor (assoc (core/get-cursor editor)
                            :x 0)))

(defn end-line [editor]
  (let [cursor (core/get-cursor editor)]
    (core/set-cursor editor (assoc cursor
                              :x (dec (core/count-line editor (:x cursor)))))))

(defn start-buffer [editor]
  (-> editor
      (move-while (constantly true) up)
      start-line))

(defn end-buffer [editor]
  (-> editor
      (move-while (constantly true) down)
      end-line))

(def functions
  (merge (fn-map left
                 down
                 up
                 right
                 forward
                 backward
                 start-line
                 end-line
                 start-buffer
                 end-buffer)
         {:h left
          :j down
          :k up
          :l right
          :w forward
          :b backward
          :| start-line
          :$ end-line
          :gg start-buffer
          :G end-buffer}))
