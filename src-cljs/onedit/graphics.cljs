(ns onedit.graphics
  (:require [clojure.string :as string]
            [clojure.browser.dom :as dom]
            [goog.dom.DomHelper :as dom-helper]
            [onedit.core :as core]
            [onedit.style :as style]
            [onedit.util :as util]
            [onedit.parser :as parser]
            [onedit.syntax :as syntax]))

(defn render [editor canvas]
  (let [g (.getContext canvas "2d")
        {:keys [x y]} (core/get-cursor editor)
        strings (core/get-strings editor)
        string (util/join-newline strings)
        table (:table (syntax/clojure (parser/parser string)))]
    (dom/log table)
    (set! (.-fillStyle g) style/text-color)
    (set! (.-font g) (str style/font-size "px " style/font-family))
    (.clearRect g 0 0 1024 1024)
    (dotimes [n (count strings)]
      (.fillText g (strings n) 0 (* (inc n) style/font-size)))
    (doto g
      (.fillText (str (subs (strings y) 0 x) style/pointer) 0 (* (inc y) style/font-size)))
    (doseq [[k c] table]
      (doseq [[a b] c]
        (set! (.-fillStyle g) (k style/highlight))
        (let [substrings (string/split-lines (subs string 0 a))]
          (.fillText g
                     (subs string a b)
                     (.-width (.measureText g (last substrings)))
                     (* (count substrings) style/font-size)))))))
