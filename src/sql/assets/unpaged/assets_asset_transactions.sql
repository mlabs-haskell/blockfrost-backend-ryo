SELECT encode(tx.hash, 'hex') AS "tx_hash",
  tx.block_index AS "tx_index",
  b.block_no AS "block_height",
  extract(
    epoch
    FROM b.time
  )::INTEGER AS "block_time"
FROM (
    SELECT txo.tx_id AS "tx_id"
    FROM ma_tx_out mto
      JOIN multi_asset ma ON (mto.ident = ma.id)
      JOIN tx_out txo ON (mto.tx_out_id = txo.id)
    WHERE (encode(policy, 'hex') || encode(name, 'hex')) = $2
    GROUP BY txo.tx_id
    ORDER BY CASE
        WHEN LOWER($1) = 'desc' THEN txo.tx_id
      END DESC,
      CASE
        WHEN LOWER($1) <> 'desc'
        OR $1 IS NULL THEN txo.tx_id
      END ASC
  ) AS "sorted"
  JOIN tx ON (sorted.tx_id = tx.id)
  JOIN block b ON (b.id = tx.block_id)