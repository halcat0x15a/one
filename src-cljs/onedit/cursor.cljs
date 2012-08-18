(ns onedit.cursor
  (:require [clojure.string :as string]
            [onedit.core :as core])
  (:use-macros [onedit.core :only [defun]]))

(defun left [editor]
  (let [cursor (core/get-cursor editor)
        x (:x cursor)]
    (if (> x 0)
      (core/set-cursor editor (assoc cursor
                               :x (dec x)))
      editor)))

(defun down [editor]
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

(defun up [editor]
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

(defun right [editor]
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

(defun forward [editor]
  (-> editor
      (move-while string/blank? right)
      (move-while (comp not string/blank?) right)))

(defun backward [editor]
  (-> editor
      left
      (move-while string/blank? left)
      (move-while (comp not string/blank?) left)
      (move-while string/blank? right)))

(defun start-line [editor]
  (core/set-cursor editor (assoc (core/get-cursor editor)
                            :x 0)))

(defun end-line [editor]
  (let [cursor (core/get-cursor editor)]
    (core/set-cursor editor (assoc cursor
                              :x (dec (core/count-line editor (:x cursor)))))))

(defun start-buffer [editor]
  (-> editor
      (move-while (constantly true) up)
      start-line))

(defun end-buffer [editor]
  (-> editor
      (move-while (constantly true) down)
      end-line))
