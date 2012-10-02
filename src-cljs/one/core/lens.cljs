(ns one.core.lens)

(deftype Lens [get set])

(defn modify [editor lens f]
  ((.set lens) editor (f ((.get lens) editor))))

(def buffers
  (Lens. :buffers
         (fn [editor buffers]
           (assoc editor :buffers buffers))))

(def buffer
  (letfn [(get-buffer [editor]
            (let [current (:current editor)]
              (case current
                :minibuffer (current editor)
                (current (:buffers editor)))))
          (set-buffer [editor buffer]
            (let [current (:current editor)]
              (case current
                :minibuffer (assoc editor :minibuffer buffer)
                (assoc editor
                  :buffers (assoc (:buffers editor)
                             current buffer)))))]
              (Lens. get-buffer set-buffer)))

(defn lens [key lens]
  (letfn [(get-field [editor]
            (get ((.get lens) editor) key))
          (set-field [editor value]
            (modify editor lens #(assoc % key value)))]
    (Lens. get-field set-field)))

(def cursor (lens :cursor buffer))

(def cursor-x (lens :x cursor))

(def cursor-y (lens :y cursor))

(def text (lens :text buffer))

(defn line [y]
  (lens y text))
