UPDATE "house_ad_campaigns"
SET
	"active" = false,
	"cooldown_seconds" = 120,
	"updated_at" = now()
WHERE
	"active" = true
	AND "cooldown_seconds" = 0
	AND "created_at" = "updated_at"
	AND (
		(
			"name" = 'Siamese Cat Café'
			AND "category" = 'cafe'
			AND "language" = 'en'
			AND "video_url" = '/game-ads/siamese-cat-cafe-en.mp4'
			AND "destination_url" = 'https://siamesecat.cafe'
		)
		OR (
			"name" = 'Siamese Cat Creative Club'
			AND "category" = 'learning_center'
			AND "language" = 'en'
			AND "video_url" = '/game-ads/creative-club-en.mp4'
			AND "destination_url" = 'https://creative.siamesecat.cafe/EN/creative'
		)
	);
