(ns felis.buffer
  (:refer-clojure :exclude [read empty])
;*CLJSBUILD-REMOVE*;(:use-macros [felis.macros :only (tag)])
  (:require [felis.string :as string]
            [felis.collection :as collection]
            [felis.edit :as edit]
            [felis.text :as text]
            [felis.serialization :as serialization]
            [felis.node :as node]
            [felis.empty :as empty]))

;*CLJSBUILD-REMOVE*;(comment
(use '[felis.macros :only (tag)])
;*CLJSBUILD-REMOVE*;)

(defn move [{:keys [focus] :as buffer} field]
  (if-let [focus' (-> buffer field peek)]
    (-> buffer
        (assoc :focus focus')
        (update-in [field] collection/pop)
        (update-in [(edit/opposite field)] #(conj % focus)))
    buffer))

(defn insert [{:keys [focus] :as buffer} field focus']
  (-> buffer
      (assoc :focus focus')
      (update-in [field] #(conj % focus))))

(defn delete [buffer field]
  (if-let [focus' (-> buffer field peek)]
    (-> buffer
        (assoc :focus focus')
        (update-in [field] collection/pop))
    buffer))

(defn inside [{:keys [lefts rights]}]
  (str lefts
       (tag :span {:class :focus}
            (get rights 0 ""))
       (string/rest rights)))

(def outside (comp string/nbsp serialization/write))

(defn render [{:keys [lefts focus rights]}]
  (tag :div {:class "buffer"}
       (->> (concat (map outside lefts)
                    (-> focus inside list)
                    (map outside rights))
            (string/make-string "<br>"))))

(defn write [{:keys [lefts focus rights]}]
  (->> (concat lefts (list focus) rights)
       (map serialization/write)
       (string/make-string \newline)))

(defrecord Buffer [name focus lefts rights]
  edit/Edit
  (move [buffer field] (move buffer field))
  (insert [buffer field focus] (insert buffer field focus))
  (delete [buffer field] (delete buffer field))
  node/Node
  (render [buffer] (render buffer))
  serialization/Serializable
  (write [buffer] (write buffer)))

(def path [:root :buffer])

(def empty (Buffer. :*scratch* text/empty [] '()))

(defn read [string]
  (let [lines (->> string string/split-lines (map text/read))]
    (assoc empty
      :focus (first lines)
      :rights (->> lines rest (apply list)))))

(defmethod node/path Buffer [_] path)

(defmethod empty/empty Buffer [_] empty)

(defmethod serialization/read Buffer [_ string] (read string))
