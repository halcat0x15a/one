(ns felis.buffer
  (:require [clojure.string :as string]
            [felis.string :as felis-string]
            [felis.collection :as collection]
            [felis.edit :as edit]
            [felis.text :as text]
            [felis.serialization :as serialization]
            [felis.node :as node]
            [felis.empty :as empty]))

(defn make-string [{:keys [focus lefts rights]} show string]
  (->> (concat (:sequence lefts)
               (list focus)
               (:sequence rights))
       (map show)
       (interpose string)
       string/join))

(defrecord Buffer [name focus lefts rights]
  edit/Edit
  (move [buffer field]
    (if-let [focus' (-> buffer field collection/peek)]
      (-> buffer
          (assoc :focus (text/map->Inner focus'))
          (update-in [field] collection/pop)
          (update-in [(edit/opposite field)] #(collection/conj % (text/map->Outer focus))))
      buffer))
  (insert [buffer field focus']
    (-> buffer
        (assoc :focus (text/map->Inner focus'))
        (update-in [field] #(collection/conj % (text/map->Outer focus)))))
  (delete [buffer field]
    (if-let [focus' (-> buffer field collection/peek)]
      (-> buffer
          (assoc :focus (text/map->Inner focus'))
          (update-in [field] collection/pop))
      buffer))
  node/Node
  (render [buffer] (make-string buffer node/render "<br>"))
  serialization/Serializable
  (write [buffer] (make-string buffer serialization/write \newline)))

(defmethod node/path Buffer [_] [:root :buffer])

(defmethod empty/empty Buffer [_]
  (Buffer. :*scratch*
           (empty/empty felis.text.Inner)
           (empty/empty felis.collection.Top)
           (empty/empty felis.collection.Bottom)))

(defmethod serialization/read Buffer [_ string]
  (let [read (partial map (partial serialization/read felis.text.Outer))
        lines (-> string felis-string/split-lines read)]
    (assoc (empty/empty Buffer)
      :focus (-> lines first text/map->Inner)
      :rights (-> lines rest collection/->Right))))
