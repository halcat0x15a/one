(ns felis.html
  (:require [clojure.string :as string]
            [felis.macros :as macros]
            [felis.style :as style]
            [felis.string :as felis-string]))

(defn nbsp [source]
  (string/replace source #" " "&nbsp;"))

(defn line [row]
  (let [{:keys [lefts rights]} row]
    (str (-> lefts :sequence nbsp) (-> rights :sequence nbsp) "<br>")))

(defn lines [rows]
  (->> rows :sequence (map line) string/join))

(defn focus [row]
  (let [{:keys [lefts rights]} row]
    (str (-> lefts :sequence nbsp)
         #tag[:span {:class :focus}
              (-> rights :sequence vec (get 0 ""))]
         (-> rights :sequence felis-string/rest nbsp) "<br>")))

(defn html [editor]
  (let [{:keys [lefts row rights]} (:buffer editor)]
    #tag[:html {}
         #tag[:head {}
              #tag[:style {:type "text/css"}
                   "<!-- "
                   (->> style/all (interpose \space) string/join)
                   " -->"]]
         #tag[:body {}
              #tag[:div {:class "editor"}
                   (lines lefts)
                   (focus row)
                   (lines rights)]]]))
