/* origin_kind: synthetic_fixture
 * classification: demo-safe
 * fictional_source_created_at: 1998-06-20
 *
 * 架空の1998年版sourceを想定したC89風projection。Return Passの補助処理のみを含む。
 * このfileはsymbolの由来を記録しない。symbol indexを参照すること。
 */

#include "relay.h"

#define RETURN_PASS_LEAD_TICKS   6
#define RETURN_PASS_MAX_OFFSET   48

extern int partner_aim(const struct actor *self,
                       const struct core *c,
                       int lead_ticks);

/* 戻るCoreに対して、受領しやすい位置を算出する。 */
int return_pass_target(const struct actor *self, const struct core *c)
{
    int target;

    target = partner_aim(self, c, RETURN_PASS_LEAD_TICKS);

    if (target - self->x > RETURN_PASS_MAX_OFFSET) {
        target = self->x + RETURN_PASS_MAX_OFFSET;
    } else if (self->x - target > RETURN_PASS_MAX_OFFSET) {
        target = self->x - RETURN_PASS_MAX_OFFSET;
    }

    return target;
}

void return_pass_update(struct actor *self, const struct core *c)
{
    int target;

    if (c->phase != CORE_PHASE_RETURN) {
        return;
    }

    target = return_pass_target(self, c);

    if (target > self->x) {
        self->x += actor_step(self, 0);
        if (self->x > target) {
            self->x = target;
        }
    } else if (target < self->x) {
        self->x -= actor_step(self, 0);
        if (self->x < target) {
            self->x = target;
        }
    }
}
