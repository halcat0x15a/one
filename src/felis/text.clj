(ns felis.text
  (:require [felis.macros :as macros]
            [felis.string :as string]
            [felis.edit :as edit]
            [felis.collection :as collection]
            [felis.serialization :as serialization]
            [felis.empty :as empty]
            [felis.node :as node]))

(defrecord Text [lefts rights]
  edit/Edit
  (move [text field]
    (if-let [value (-> text field collection/peek)]
      (-> text
          (update-in [field] collection/pop)
          (update-in [(edit/opposite field)] #(collection/conj % value)))
      text))
  (insert [text field char]
    (update-in text [field] #(collection/conj % char)))
  (delete [text field]
    (update-in text [field] collection/pop))
  serialization/Serializable
  (write [_]
    (str (serialization/write lefts) (serialization/write rights))))

(defprotocol Line
  (text [line]))

(extend-type felis.text.Line
  serialization/Serializable
  (write [line]
    (-> line text serialization/write)))

(defrecord Inner [text]
  Line
  (text [_] text)
  node/Node
  (render [_]
    (let [rights (-> text :rights :sequence)]
      (str (-> text :lefts :sequence)
           #tag[:span {:class :focus}
                (get rights 0 "")]
           (string/rest rights)))))

(defrecord Outer [text]
  Line
  (text [_] text)
  node/Node
  (render [_]
    (-> text serialization/write string/nbsp)))

(defrecord Minibuffer [text]
  Line
  (text [_] text)
  node/Node
  (render [_] ""))

(defmethod node/path Inner [_] [:root :buffer :focus])

(defmethod node/path Minibuffer [_] [:root :minibuffer])

(defmethod empty/empty Text [_]
  (Text. (empty/empty felis.collection.Left)
         (empty/empty felis.collection.Right)))

(defmethod empty/empty Inner [_]
  (Inner. (empty/empty felis.text.Text)))

(defmethod empty/empty Minibuffer [_]
  (Minibuffer. (empty/empty felis.text.Text)))

(defmethod serialization/read Text [_ string]
  (assoc (empty/empty Text)
    :rights (serialization/read felis.collection.Right string)))

(defmethod serialization/read Outer [_ string]
  (->> string (serialization/read Text) Outer.))
