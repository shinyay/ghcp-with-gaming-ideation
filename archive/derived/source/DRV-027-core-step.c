/* origin_kind: synthetic_fixture
 * classification: demo-safe
 * fictional_source_created_at: 1998-06-20
 *
 * 架空の1998年版sourceを想定したC89風projection。実機ROMからの逆解析ではなく、
 * 読解用に書き起こした合成fixtureである。
 */

#include "relay.h"

#define SCREEN_W          320
#define UNITS_PER_PX      16
#define FIELD_W           (SCREEN_W * UNITS_PER_PX)

#define CORE_HOLDER_STEP      80
#define CORE_NON_HOLDER_STEP  120
#define CORE_OUTBOUND_STEP    180
#define CORE_RETURN_STEP      240

#define CHAIN_MAX         32
#define CHARGE_MAX        100
#define TICKS_PER_SECOND  60

/* Coreは常に1体だけがownerとなる。送信中もownerは送信者のままとする。 */
static int core_owner;

void core_throw_step(struct core *c)
{
    c->x += CORE_OUTBOUND_STEP;
    if (c->x >= FIELD_W) {
        c->x = FIELD_W;
        c->phase = CORE_PHASE_RETURN;
    }
}

void core_return_step(struct core *c, const struct actor *receiver)
{
    if (c->x > receiver->x) {
        c->x -= CORE_RETURN_STEP;
        if (c->x < receiver->x) {
            c->x = receiver->x;
        }
    } else {
        c->x += CORE_RETURN_STEP;
        if (c->x > receiver->x) {
            c->x = receiver->x;
        }
    }
}

int actor_step(struct actor *a, int holds_core)
{
    return holds_core ? CORE_HOLDER_STEP : CORE_NON_HOLDER_STEP;
}

void chain_commit(struct score *s)
{
    if (s->chain < CHAIN_MAX) {
        s->chain++;
    }
    if (s->charge > CHARGE_MAX) {
        s->charge = CHARGE_MAX;
    }
}

int core_owner_get(void)
{
    return core_owner;
}

void core_owner_set(int owner)
{
    core_owner = owner;
}
