(ns onedit.buffer
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom :as gdom]
            [onedit.core :as core])
  (:use-macros [clojure.core.match.js :only [match]]))

(defn create []
  (string/split (gdom/getRawTextContent (dom/ensure-element :buffer)) #"\n"))

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

(core/register :i insert)
(core/register :o new-line)
