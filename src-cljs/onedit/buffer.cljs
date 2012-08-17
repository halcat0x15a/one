(ns onedit.buffer
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [onedit.core :as core])
  (:use-macros [clojure.core.match.js :only [match]]))

(def count-lines (comp count :buffer))

(defn count-line [editor y]
  (count (get (:buffer editor) y)))

(defn create []
  (string/split-lines (gdom/getRawTextContent (dom/ensure-element :buffer))))

(defn update [buffer]
  (dom/set-text :buffer (string/join (interpose \newline buffer))))

(defn new-line [editor]
  (let [cursor (:cursor editor)]
    (assoc editor
      :buffer (conj (:buffer editor) "")
      :cursor (assoc cursor
                :x 0
                :y (inc (:y cursor))))))

(defn insert [editor & strings]
  (match [(vec strings)]
    [[]] editor
    [[string]] (let [cursor (:cursor editor)
                     x (:x cursor)
                     y (:y cursor)
                     buffer (:buffer editor)
                     line (get buffer y)
                     line' (str (subs line 0 x) string (subs line x (count line)))]
                 (assoc editor
                   :buffer (assoc buffer y line')
                   :cursor (assoc cursor
                             :x (+ x (count string)))))
    [[string & strings']] (apply insert (insert (insert editor string) " ") strings')))

(defn delete-forward [editor]
  (let [cursor (:cursor editor)
        buffer (:buffer editor)
        y (:y cursor)
        line (get buffer y)
        length (count line)
        x (:x cursor)]
    (if (> length 0)
      (assoc editor
        :buffer (assoc buffer
                  y
                  (str (subs line 0 x) (subs line (inc x) (count line)))))
      editor)))

(defn delete-backward [editor]
  (let [cursor (:cursor editor)
        buffer (:buffer editor)
        y (:y cursor)
        line (get buffer y)
        length (count line)
        x (:x cursor)]
    (if (> length 0)
      (assoc editor
        :buffer (assoc buffer
                  y
                  (str (subs line 0 (dec x)) (subs line x (count line))))
        :cursor (assoc cursor
                  :x (dec x)))
      editor)))

(core/register :i insert)
(core/register :o new-line)
(core/register :x delete-forward)
(core/register :X delete-backward)
