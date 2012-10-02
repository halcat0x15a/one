(ns one.core.lens)

(defprotocol Lens
  (lens-get [this editor])
  (lens-set [this value editor]))

(defn modify [lens f editor]
  (lens-set lens (f (lens-get lens editor)) editor))

(def buffers
  (reify Lens
    (lens-get [this editor] (:buffers editor))
    (lens-set [this buffers editor]
      (assoc editor :buffers buffers))))

(def buffer
  (reify Lens
    (lens-get [this editor]
      (let [current (:current editor)]
        (case current
          :minibuffer (current editor)
          (current (:buffers editor)))))
    (lens-set [this buffer editor]
      (let [current (:current editor)]
        (case current
          :minibuffer (assoc editor :minibuffer buffer)
          (assoc editor
            :buffers (assoc (:buffers editor)
                       current buffer)))))))

(defn lens [key lens]
  (reify Lens
    (lens-get [this editor]
      (get (lens-get lens editor) key))
    (lens-set [this value editor]
      (modify lens #(assoc % key value) editor))))

(def cursor (lens :cursor buffer))

(def cursor-x (lens :x cursor))

(def cursor-y (lens :y cursor))

(def text (lens :text buffer))

(defn line [y]
  (lens y text))
